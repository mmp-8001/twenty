import { isDefined } from 'twenty-sdk/utils';

import {
  listRecords,
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import {
  readSegmentRule,
  type MetadataClient,
} from 'src/logic-functions/utils/read-segment-rule.util';

const WRITE_BATCH_SIZE = 100;

type Connection<TNode> = { edges?: { node?: TNode }[] };
type SegmentLink = {
  campaignId: string;
  segment?: { viewId?: string | null; isActive?: boolean } | null;
};
type AgentLink = { campaignId: string; agentId: string | null };
type AgentRow = {
  isActive?: boolean;
  frozenSince?: string | null;
  members?: Connection<{ id: string }>;
};

// One entry per Active campaign that can grant eligibility: the members it grants to, and a Person filter per valid segment.
export type EligibilityPlan = {
  campaignId: string;
  startsAt: string;
  createdAt: string;
  memberIds: string[];
  segmentFilters: Record<string, unknown>[];
}[];

const nodesOf = <TNode>(connection?: Connection<TNode>) =>
  (connection?.edges ?? []).map(({ node }) => node).filter(isDefined);

export const loadEligibilityPlan = async (
  client: RecordsClient,
  metadata: MetadataClient,
): Promise<EligibilityPlan> => {
  const campaigns = await listRecords<{ id: string; startsAt: string; createdAt: string }>(
    client,
    'campaigns',
    { status: { eq: 'ACTIVE' } },
    { startsAt: true, createdAt: true },
  );

  if (campaigns.length === 0) {
    return [];
  }

  const campaignFilter = { campaignId: { in: campaigns.map(({ id }) => id) } };
  // Two queries: the API refuses a one-to-many nested in another one-to-many.
  const segmentLinks = await listRecords<SegmentLink>(client, 'campaignSegments', campaignFilter, {
    campaignId: true,
    segment: { id: true, viewId: true, isActive: true },
  });
  const agentLinks = await listRecords<AgentLink>(client, 'campaignAgents', campaignFilter, {
    campaignId: true,
    agentId: true,
  });
  // Members are read from the Agent root: nested under the junction they come back empty.
  const agentById = new Map(
    (
      await listRecords<AgentRow & { id: string }>(
        client,
        'agents',
        { id: { in: agentLinks.map(({ agentId }) => agentId).filter(isDefined) } },
        { isActive: true, frozenSince: true, members: { edges: { node: { id: true } } } },
      )
    ).map((agent) => [agent.id, agent]),
  );
  const ruleByViewId = new Map<string, Record<string, unknown> | null>();
  const plan: EligibilityPlan = [];

  for (const { id: campaignId, startsAt, createdAt } of campaigns) {
    const memberIds = agentLinks
      .filter((link) => link.campaignId === campaignId)
      .map(({ agentId }) => (isDefined(agentId) ? agentById.get(agentId) : undefined))
      .filter((agent) => isDefined(agent) && agent.isActive && !isDefined(agent.frozenSince))
      .flatMap((agent) => nodesOf(agent?.members).map(({ id }) => id));
    const segmentFilters: Record<string, unknown>[] = [];

    for (const { segment } of segmentLinks.filter((link) => link.campaignId === campaignId)) {
      if (!segment?.isActive || !segment.viewId) {
        continue;
      }

      if (!ruleByViewId.has(segment.viewId)) {
        const rule = await readSegmentRule(metadata, segment.viewId);

        ruleByViewId.set(segment.viewId, rule.isValid ? rule.filter : null);
      }

      const filter = ruleByViewId.get(segment.viewId);

      if (isDefined(filter)) {
        segmentFilters.push(filter);
      }
    }

    if (memberIds.length > 0 && segmentFilters.length > 0) {
      plan.push({ campaignId, startsAt, createdAt, memberIds, segmentFilters });
    }
  }

  return plan;
};

const sameMembers = (left: string[], right: string[]) =>
  left.length === right.length && left.every((id, index) => id === right[index]);

const uniqueSorted = (ids: Iterable<string>) => [...new Set(ids)].sort();

const writeEligibility = async (
  client: RecordsClient,
  idsByMembers: Map<string, { memberIds: string[]; personIds: string[] }>,
) => {
  for (const { memberIds, personIds } of idsByMembers.values()) {
    for (let start = 0; start < personIds.length; start += WRITE_BATCH_SIZE) {
      await updateRecordsWhere(
        client,
        'People',
        { id: { in: personIds.slice(start, start + WRITE_BATCH_SIZE) } },
        { eligibleMemberIds: memberIds },
      );
    }
  }
};

type EligibilityRow = { id: string; eligibleMemberIds: string[] | null };

// Full pass: members come only from Free contacts matching a segment of an Active campaign.
export const recomputeAllEligibility = async (
  client: RecordsClient,
  plan: EligibilityPlan,
): Promise<number> => {
  const desired = new Map<string, Set<string>>();

  for (const { memberIds, segmentFilters } of plan) {
    for (const segmentFilter of segmentFilters) {
      const matches = await listRecords<{ id: string }>(
        client,
        'people',
        { and: [segmentFilter, { lifecycleStage: { eq: 'FREE' } }] },
        {},
      );

      for (const { id } of matches) {
        const members = desired.get(id) ?? new Set<string>();

        memberIds.forEach((memberId) => members.add(memberId));
        desired.set(id, members);
      }
    }
  }

  const holders = await listRecords<EligibilityRow>(
    client,
    'people',
    { eligibleMemberIds: { isEmptyArray: false } },
    { eligibleMemberIds: true },
  );
  const currentById = new Map(
    holders.map(({ id, eligibleMemberIds }) => [id, uniqueSorted(eligibleMemberIds ?? [])]),
  );
  const changes = new Map<string, { memberIds: string[]; personIds: string[] }>();
  const queue = (personId: string, memberIds: string[]) => {
    const key = memberIds.join(',');
    const entry = changes.get(key) ?? { memberIds, personIds: [] };

    entry.personIds.push(personId);
    changes.set(key, entry);
  };
  let changed = 0;

  for (const [personId, members] of desired) {
    const memberIds = uniqueSorted(members);

    if (!sameMembers(currentById.get(personId) ?? [], memberIds)) {
      queue(personId, memberIds);
      changed += 1;
    }
  }

  for (const personId of currentById.keys()) {
    if (!desired.has(personId)) {
      queue(personId, []);
      changed += 1;
    }
  }

  await writeEligibility(client, changes);

  return changed;
};

// Per contact, right after a lifecycle change or an upsert.
export const recomputeContactEligibility = async (
  client: RecordsClient,
  plan: EligibilityPlan,
  personId: string,
): Promise<void> => {
  const [person] = await listRecords<{
    lifecycleStage: string | null;
    eligibleMemberIds: string[] | null;
  }>(client, 'people', { id: { eq: personId } }, { lifecycleStage: true, eligibleMemberIds: true }, 1);

  if (!isDefined(person)) {
    return;
  }

  const members = new Set<string>();

  if (person.lifecycleStage === 'FREE') {
    for (const { memberIds, segmentFilters } of plan) {
      const matches = await listRecords<{ id: string }>(
        client,
        'people',
        { and: [{ id: { eq: personId } }, { or: segmentFilters }] },
        {},
        1,
      );

      if (matches.length > 0) {
        memberIds.forEach((memberId) => members.add(memberId));
      }
    }
  }

  const memberIds = uniqueSorted(members);

  if (!sameMembers(uniqueSorted(person.eligibleMemberIds ?? []), memberIds)) {
    await updateRecordsWhere(client, 'People', { id: { eq: personId } }, { eligibleMemberIds: memberIds });
  }
};
