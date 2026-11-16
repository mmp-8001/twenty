import { type MetadataApiClient } from 'twenty-client-sdk/metadata';
import { isNonEmptyArray } from 'twenty-shared/utils';

import {
  listRecords,
  updateRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { runEligibilityRefresh } from 'src/logic-functions/utils/refresh-eligibility.util';
import {
  SHOWCASE_CODE_PREFIX,
  SHOWCASE_NAME_PREFIX,
  SHOWCASE_PLATFORM_USER_PREFIX,
} from 'src/logic-functions/utils/showcase/showcase-data.util';

export type ClearShowcaseResult = { deleted: number };

const idsOf = async (client: RecordsClient, collection: string, filter: Record<string, unknown>) =>
  (await listRecords<{ id: string }>(client, collection, filter, {})).map(({ id }) => id);

const anyOf = (clauses: [string, string[]][]) => {
  const present = clauses.filter(([, ids]) => isNonEmptyArray(ids));

  return present.length === 0 ? null : { or: present.map(([field, ids]) => ({ [field]: { in: ids } })) };
};

// Soft delete only: the app role cannot destroy, and soft-deleted rows drop out of every view and count.
const softDeleteWhere = async (client: RecordsClient, plural: string, filter: Record<string, unknown> | null) => {
  if (filter === null) {
    return 0;
  }

  const result = (await client.mutation({
    [`delete${plural}`]: { __args: { filter }, id: true },
  } as never)) as unknown as Record<string, { id: string }[] | null>;

  return (result[`delete${plural}`] ?? []).length;
};

export const clearShowcase = async ({
  client,
  metadata,
  now,
}: {
  client: RecordsClient;
  metadata: MetadataApiClient;
  now: Date;
}): Promise<ClearShowcaseResult> => {
  const personIds = await idsOf(client, 'people', { platformUserId: { like: `${SHOWCASE_PLATFORM_USER_PREFIX}%` } });
  const agentIds = await idsOf(client, 'agents', { name: { like: `${SHOWCASE_NAME_PREFIX}%` } });
  const campaignIds = await idsOf(client, 'campaigns', { name: { like: `${SHOWCASE_NAME_PREFIX}%` } });
  const segments = await listRecords<{ id: string; viewId: string | null }>(
    client,
    'segments',
    { name: { like: `${SHOWCASE_NAME_PREFIX}%` } },
    { viewId: true },
  );
  const codeIds = await idsOf(client, 'discountCodes', { code: { like: `${SHOWCASE_CODE_PREFIX}%` } });
  const callIds = isNonEmptyArray(personIds) ? await idsOf(client, 'calls', { contactId: { in: personIds } }) : [];
  const incomeIds = isNonEmptyArray(agentIds) ? await idsOf(client, 'monthlyIncomes', { agentId: { in: agentIds } }) : [];
  let deleted = 0;

  // Dependents before the rows they point at.
  const steps: [string, Record<string, unknown> | null][] = [
    ['CallReasons', anyOf([['callId', callIds]])],
    ['Calls', anyOf([['contactId', personIds], ['agentId', agentIds]])],
    ['CodeActivations', anyOf([['contactId', personIds], ['codeId', codeIds]])],
    ['Purchases', anyOf([['contactId', personIds], ['creditedAgentId', agentIds]])],
    ['Opportunities', anyOf([['pointOfContactId', personIds], ['agentId', agentIds]])],
    [
      'AuditLogs',
      anyOf([
        ['contactId', personIds],
        ['subjectAgentId', agentIds],
        ['fromAgentId', agentIds],
        ['toAgentId', agentIds],
        ['discountCodeId', codeIds],
        ['monthlyIncomeId', incomeIds],
      ]),
    ],
    ['MonthlyIncomes', anyOf([['id', incomeIds]])],
    ['FreezePeriods', anyOf([['agentId', agentIds]])],
    ['PlatformEventInboxes', { platformUserId: { like: `${SHOWCASE_PLATFORM_USER_PREFIX}%` } }],
    ['CampaignSegments', anyOf([['campaignId', campaignIds]])],
    ['CampaignAgents', anyOf([['campaignId', campaignIds], ['agentId', agentIds]])],
    ['CampaignCodes', anyOf([['campaignId', campaignIds], ['codeId', codeIds]])],
    ['People', anyOf([['id', personIds]])],
    ['DiscountCodes', anyOf([['id', codeIds]])],
    ['Campaigns', anyOf([['id', campaignIds]])],
    ['Segments', anyOf([['id', segments.map(({ id }) => id)]])],
  ];

  for (const [plural, filter] of steps) {
    deleted += await softDeleteWhere(client, plural, filter);
  }

  if (isNonEmptyArray(agentIds)) {
    for (const { id } of await listRecords<{ id: string }>(client, 'workspaceMembers', { agentId: { in: agentIds } }, {})) {
      await updateRecord(client, 'WorkspaceMember', id, { agentId: null });
    }

    deleted += await softDeleteWhere(client, 'Agents', { id: { in: agentIds } });
  }

  // shortcut: only views linked from a showcase Segment are removed; a seed that died between view and Segment leaves an orphan view, delete it by hand.
  for (const { viewId } of segments) {
    if (viewId) {
      await metadata.mutation({ deleteView: { __args: { id: viewId } } } as never).catch(() => undefined);
    }
  }

  await runEligibilityRefresh(now, client, metadata);

  return { deleted };
};
