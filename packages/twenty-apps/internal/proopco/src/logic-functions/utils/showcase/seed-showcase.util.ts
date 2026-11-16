import { type MetadataApiClient } from 'twenty-client-sdk/metadata';
import { isDefined } from 'twenty-sdk/utils';

import { DAY_MS, HOUR_MS } from 'src/constants/time.constant';
import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { type AgentActor } from 'src/logic-functions/utils/agent-actor.util';
import { claimContact } from 'src/logic-functions/utils/claim-contact.util';
import { closeExpiredDeals } from 'src/logic-functions/utils/close-expired-deals.util';
import { createDiscountCode } from 'src/logic-functions/utils/discount-code.util';
import { loadEligibilityPlan } from 'src/logic-functions/utils/eligibility.util';
import { freezeAgent } from 'src/logic-functions/utils/freeze-agent.util';
import { markIncomesPaid } from 'src/logic-functions/utils/income-paid.util';
import { logCall, type LogCallInput } from 'src/logic-functions/utils/log-call.util';
import { loadMemberRoleIdentifiers } from 'src/logic-functions/utils/member-roles.util';
import { rollUpMonthlyIncomes } from 'src/logic-functions/utils/monthly-income-rollup.util';
import { type PlatformEvent } from 'src/logic-functions/utils/parse-platform-envelope.util';
import { type PlatformClient } from 'src/logic-functions/utils/platform-client.util';
import { processInboxRow } from 'src/logic-functions/utils/process-inbox-row.util';
import {
  createRecord,
  listRecords,
  updateRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { runEligibilityRefresh } from 'src/logic-functions/utils/refresh-eligibility.util';
import { createFakePlatformClient } from 'src/logic-functions/utils/showcase/fake-platform-client.util';
import {
  contactEventOf,
  FROZEN_AGENT_CONTACT_INDEX,
  lastLostEventOf,
  MAX_SHOWCASE_AGENTS,
  newShowcaseRunId,
  platformUserIdOf,
  purchaseEventOf,
  runIdOfPlatformUserId,
  SHOWCASE_CONTACT_COUNT,
  SHOWCASE_NAME_PREFIX,
  SHOWCASE_PLATFORM_USER_PREFIX,
  SHOWCASE_SCRIPTS,
  showcaseCodeOf,
  showcaseCountryOf,
  showcaseKey,
  UNATTRIBUTED_PURCHASE_INDEX,
  type ShowcaseCall,
  type ShowcaseScript,
} from 'src/logic-functions/utils/showcase/showcase-data.util';
import { storePlatformEvent } from 'src/logic-functions/utils/store-platform-event.util';
import { transferContacts, releaseContacts } from 'src/logic-functions/utils/transfer-contacts.util';
import { jalaliMonthStart, jalaliPartsOf } from 'src/utils/jalali.util';
import { tehranDateOf } from 'src/utils/tehran-day.util';

type ShowcaseCaller = { memberId: string; name: string };

type SeedContext = {
  client: RecordsClient;
  metadata: MetadataApiClient;
  caller: ShowcaseCaller;
  runId: string;
  now: Date;
  platform: PlatformClient;
  warnings: string[];
};

type Codes = { campaign: { id: string; code: string }; rebuy: { id: string }; retention: { id: string } };
type Reasons = { answered: { id: string; requiresText: boolean }; doNotContact: { id: string } };

export type SeedShowcaseResult = { runId: string; agents: number; contacts: number; warnings: string[] };

const at = (context: SeedContext, offsetMs: number) => new Date(context.now.getTime() + offsetMs);

// One failing step must not cost the whole showcase; a rerun resumes it.
const attempt = async (context: SeedContext, label: string, run: () => Promise<unknown>) => {
  try {
    await run();
  } catch (error) {
    context.warnings.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// A step that must succeed names itself in the error, so a stopped run says where.
const stage = async <TResult>(label: string, run: () => Promise<TResult>): Promise<TResult> => {
  try {
    return await run();
  } catch (error) {
    throw new Error(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const queryMetadata = async <TData>(metadata: MetadataApiClient, selection: Record<string, unknown>) =>
  (await metadata.query(selection as never)) as unknown as TData;

const mutateMetadata = async <TData>(metadata: MetadataApiClient, selection: Record<string, unknown>) =>
  (await metadata.mutation(selection as never)) as unknown as TData;

export const findShowcaseRunId = async (client: RecordsClient) => {
  const [person] = await listRecords<{ platformUserId: string }>(
    client,
    'people',
    { platformUserId: { like: `${SHOWCASE_PLATFORM_USER_PREFIX}%` } },
    { platformUserId: true },
    1,
  );

  return isDefined(person) ? runIdOfPlatformUserId(person.platformUserId) : null;
};

const memberName = (name: { firstName: string; lastName: string } | null) =>
  `${name?.firstName ?? ''} ${name?.lastName ?? ''}`.trim() || 'Agent';

const ensureAgents = async (context: SeedContext): Promise<AgentActor[]> => {
  const members = await listRecords<{
    id: string;
    name: { firstName: string; lastName: string } | null;
    agent: { id: string; name: string } | null;
  }>(context.client, 'workspaceMembers', {}, { name: { firstName: true, lastName: true }, agent: { id: true, name: true } });
  const roles = await loadMemberRoleIdentifiers(context.metadata);
  const actors: AgentActor[] = members
    .filter(({ agent }) => agent?.name.startsWith(SHOWCASE_NAME_PREFIX))
    .map(({ id, agent }) => ({ memberId: id, agentId: agent!.id, name: agent!.name }));
  const spare = members.filter(
    ({ id, agent }) =>
      !isDefined(agent) &&
      (roles.get(id) ?? []).some((role) => [AGENT_ROLE_UNIVERSAL_IDENTIFIER, SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER].includes(role)),
  );
  const callerMember = members.find(({ id }) => id === context.caller.memberId);

  // Without spare members the showcase still shows one agent's work, through the caller.
  if (actors.length === 0 && spare.length === 0 && isDefined(callerMember) && !isDefined(callerMember.agent)) {
    spare.push(callerMember);
  }

  // An earlier run may have stopped between creating an Agent and linking it.
  const linkedAgentIds = new Set(members.map(({ agent }) => agent?.id).filter(isDefined));
  const unlinked = (
    await listRecords<{ id: string; name: string }>(context.client, 'agents', { name: { like: `${SHOWCASE_NAME_PREFIX}%` } }, { name: true })
  ).filter(({ id }) => !linkedAgentIds.has(id));

  for (const member of spare.slice(0, Math.max(0, MAX_SHOWCASE_AGENTS - actors.length))) {
    const name = `${SHOWCASE_NAME_PREFIX}${memberName(member.name)}`;
    const agentId = unlinked.find((agent) => agent.name === name)?.id ?? (await createRecord(context.client, 'Agent', { name }));

    await updateRecord(context.client, 'WorkspaceMember', member.id, { agentId });
    actors.push({ memberId: member.id, agentId, name });
  }

  return actors;
};

const ensureCode = async (
  context: SeedContext,
  suffix: string,
  capability: string,
  sets: { inRebuySet?: boolean; inRetentionSet?: boolean },
) => {
  const code = showcaseCodeOf(context.runId, suffix);
  const [existing] = await listRecords<{ id: string }>(context.client, 'discountCodes', { code: { eq: code } }, {}, 1);

  if (isDefined(existing)) {
    return { id: existing.id, code };
  }

  const { id } = await createDiscountCode(
    context.client,
    context.platform,
    {
      code,
      capability,
      expiresAt: at(context, 60 * DAY_MS).toISOString(),
      idempotencyKey: showcaseKey(context.runId, 'code', suffix),
      ...sets,
    },
    context.now,
  );

  return { id, code };
};

const ensureCodes = async (context: SeedContext): Promise<Codes> => ({
  campaign: await ensureCode(context, 'D20', 'DISCOUNT', {}),
  rebuy: await ensureCode(context, 'RESET', 'RESET', { inRebuySet: true }),
  retention: await ensureCode(context, 'TWOSTEP', 'TWO_STEP_PAYMENT', { inRetentionSet: true }),
});

const loadReasons = async (context: SeedContext): Promise<Reasons> => {
  const reasons = await listRecords<{ id: string; kind: string; requiresText: boolean }>(
    context.client,
    'reasons',
    { isActive: { eq: true } },
    { kind: true, requiresText: true },
  );
  const answered = reasons.find(({ kind, requiresText }) => kind !== 'DO_NOT_CONTACT' && !requiresText) ?? reasons.find(({ kind }) => kind !== 'DO_NOT_CONTACT');
  const doNotContact = reasons.find(({ kind }) => kind === 'DO_NOT_CONTACT');

  if (!isDefined(answered) || !isDefined(doNotContact)) {
    throw new Error('The showcase needs active reasons, including a do-not-contact one');
  }

  return { answered, doNotContact };
};

const ingest = async (context: SeedContext, event: PlatformEvent) => {
  const row = await storePlatformEvent(context.client, event);

  if (isDefined(row)) {
    await processInboxRow(context.client, row, new Date(event.occurredAt));
  }
};

const ensureContacts = async (context: SeedContext) => {
  for (let index = 0; index < SHOWCASE_CONTACT_COUNT; index += 1) {
    await attempt(context, `contact ${index}`, () =>
      ingest(context, contactEventOf(context.runId, index, at(context, -45 * DAY_MS + index * 60_000))),
    );
  }
};

const ensureSegmentView = async (context: SeedContext, name: string, country: string) => {
  const { objects } = await queryMetadata<{
    objects: { edges: { node: { id: string; nameSingular: string; fieldsList: { id: string; name: string }[] } }[] };
  }>(context.metadata, {
    objects: { __args: { paging: { first: 200 } }, edges: { node: { id: true, nameSingular: true, fieldsList: { id: true, name: true } } } },
  });
  const person = objects.edges.find(({ node }) => node.nameSingular === 'person')?.node;
  const countryField = person?.fieldsList.find((field) => field.name === 'country');

  if (!isDefined(person) || !isDefined(countryField)) {
    throw new Error('The person country field was not found');
  }

  const { createView } = await mutateMetadata<{ createView: { id: string } }>(context.metadata, {
    createView: { __args: { input: { name, icon: 'IconFilter', objectMetadataId: person.id } }, id: true },
  });

  await mutateMetadata(context.metadata, {
    createViewFilter: {
      __args: { input: { viewId: createView.id, fieldMetadataId: countryField.id, operand: 'CONTAINS', value: country } },
      id: true,
    },
  });

  return createView.id;
};

const ensureNamed = async (context: SeedContext, collection: string, name: string, create: () => Promise<string>) => {
  const [existing] = await listRecords<{ id: string }>(context.client, collection, { name: { eq: name } }, {}, 1);

  return existing?.id ?? create();
};

const ensureCampaigns = async (context: SeedContext, agents: AgentActor[], codes: Codes) => {
  const segmentIds: Record<'A' | 'B', string> = { A: '', B: '' };

  for (const group of ['A', 'B'] as const) {
    const name = `${SHOWCASE_NAME_PREFIX}${group === 'A' ? 'Iran' : 'Emirates'} ${context.runId}`;

    segmentIds[group] = await ensureNamed(context, 'segments', name, async () =>
      createRecord(context.client, 'Segment', {
        name,
        viewId: await ensureSegmentView(context, name, showcaseCountryOf(context.runId, group)),
      }),
    );
  }

  const linkCampaign = async (campaignId: string, segments: string[], codeIds: string[]) => {
    for (const segmentId of segments) {
      await createRecord(context.client, 'CampaignSegment', { campaignId, segmentId });
    }

    for (const { agentId } of agents) {
      await createRecord(context.client, 'CampaignAgent', { campaignId, agentId });
    }

    for (const codeId of codeIds) {
      await createRecord(context.client, 'CampaignCode', { campaignId, codeId });
    }
  };
  const activeName = `${SHOWCASE_NAME_PREFIX}Autumn ${context.runId}`;
  const scheduledName = `${SHOWCASE_NAME_PREFIX}Winter ${context.runId}`;

  await ensureNamed(context, 'campaigns', activeName, async () => {
    const id = await createRecord(context.client, 'Campaign', {
      name: activeName,
      startsAt: tehranDateOf(at(context, -60 * DAY_MS)),
      cooldownDays: 14,
    });

    await linkCampaign(id, [segmentIds.A, segmentIds.B], [codes.campaign.id]);

    return id;
  });
  await ensureNamed(context, 'campaigns', scheduledName, async () => {
    const id = await createRecord(context.client, 'Campaign', {
      name: scheduledName,
      startsAt: tehranDateOf(at(context, 20 * DAY_MS)),
      cooldownDays: 30,
    });

    await linkCampaign(id, [segmentIds.B], []);

    return id;
  });

  await runEligibilityRefresh(context.now, context.client, context.metadata);
};

const findPerson = async (context: SeedContext, index: number) => {
  const [person] = await listRecords<{ id: string; ownerId: string | null; lifecycleStage: string }>(
    context.client,
    'people',
    { platformUserId: { eq: platformUserIdOf(context.runId, index) } },
    { ownerId: true, lifecycleStage: true },
    1,
  );

  return person;
};

const callInput = (
  context: SeedContext,
  personId: string,
  key: string,
  call: ShowcaseCall,
  reasons: Reasons,
  codes: Codes,
): LogCallInput => {
  const base = { personId, idempotencyKey: showcaseKey(context.runId, 'call', key), technicalStatus: call.status };

  if (call.status === 'NO_ANSWER') {
    return { ...base, next: { mode: 'schedule', at: at(context, call.nextAt).toISOString(), outsidePlanReason: 'USER_REQUEST' } };
  }

  const answered = {
    ...base,
    reasonIds: [reasons.answered.id],
    otherReasonText: reasons.answered.requiresText ? 'Showcase' : null,
    note: 'Showcase call',
  };
  const codeIds = 'withCode' in call && isDefined(call.withCode) ? [call.withCode === 'CAMPAIGN' ? codes.campaign.id : codes.retention.id] : [];

  if ('doNotContact' in call) {
    return { ...answered, next: { mode: 'doNotContact', reasonId: reasons.doNotContact.id } };
  }

  if ('retentionDone' in call) {
    return { ...answered, next: { mode: 'none' }, codeIds };
  }

  return { ...answered, next: { mode: 'schedule', at: at(context, call.nextAt).toISOString(), outsidePlanReason: 'USER_REQUEST' }, codeIds };
};

const agentForScript = (agents: AgentActor[], index: number) => {
  if (index === FROZEN_AGENT_CONTACT_INDEX) {
    return agents[agents.length - 1];
  }

  return index === 13 ? agents[0] : agents[index % agents.length];
};

const runScript = async (context: SeedContext, script: ShowcaseScript, agents: AgentActor[], reasons: Reasons, codes: Codes) => {
  const actor = agentForScript(agents, script.index);
  const label = `contact ${script.index}`;
  const person = await findPerson(context, script.index);

  if (!isDefined(person)) {
    context.warnings.push(`${label}: not found`);

    return;
  }

  if (!isDefined(person.ownerId) && person.lifecycleStage === 'FREE') {
    await attempt(context, `${label} claim`, () =>
      claimContact({ client: context.client, metadata: context.metadata, actor, personId: person.id, now: at(context, script.claimAt) }),
    );
  }

  for (const [position, call] of script.calls.entries()) {
    await attempt(context, `${label} call ${position}`, () =>
      logCall(context.client, actor, callInput(context, person.id, `${script.index}-${position}`, call, reasons, codes), at(context, call.at), context.platform),
    );
  }

  if (isDefined(script.purchase)) {
    const { purchase } = script;

    await attempt(context, `${label} purchase`, () =>
      ingest(
        context,
        purchaseEventOf(
          context.runId,
          String(script.index),
          platformUserIdOf(context.runId, script.index),
          purchase.amountUsdt,
          purchase.withCode === true ? codes.campaign.code : null,
          at(context, purchase.at),
        ),
      ),
    );
  }

  if (isDefined(script.retentionCall)) {
    const call = script.retentionCall;

    await attempt(context, `${label} retention call`, () =>
      logCall(context.client, actor, callInput(context, person.id, `${script.index}-retention`, call, reasons, codes), at(context, call.at), context.platform),
    );
  }

  if (isDefined(script.lastLostAt)) {
    await attempt(context, `${label} account lost`, () =>
      ingest(context, lastLostEventOf(context.runId, script.index, at(context, script.lastLostAt!))),
    );
  }
};

const runSupervisorActions = async (context: SeedContext, agents: AgentActor[]) => {
  const auditContext = { client: context.client, metadata: context.metadata };
  const transferred = SHOWCASE_SCRIPTS.find(({ transferAt }) => isDefined(transferAt));
  const released = SHOWCASE_SCRIPTS.find(({ releaseAt }) => isDefined(releaseAt));

  if (agents.length >= 2 && isDefined(transferred)) {
    const person = await findPerson(context, transferred.index);

    if (isDefined(person) && person.ownerId === agents[0].agentId) {
      await attempt(context, 'transfer', () =>
        transferContacts(auditContext, {
          caller: context.caller,
          personIds: [person.id],
          toAgentId: agents[1].agentId,
          reason: 'Showcase: workload balance',
          now: at(context, transferred.transferAt!),
        }),
      );
    }
  }

  if (isDefined(released)) {
    const person = await findPerson(context, released.index);

    if (isDefined(person?.ownerId)) {
      await attempt(context, 'release', () =>
        releaseContacts(auditContext, {
          caller: context.caller,
          personIds: [person.id],
          reason: 'Showcase: back to the pool',
          now: at(context, released.releaseAt!),
        }),
      );
    }
  }

  const frozen = agents[agents.length - 1];
  const [frozenRow] = await listRecords<{ frozenSince: string | null }>(context.client, 'agents', { id: { eq: frozen.agentId } }, { frozenSince: true }, 1);

  if (agents.length >= 2 && !isDefined(frozenRow?.frozenSince)) {
    await attempt(context, 'freeze', () =>
      freezeAgent(auditContext, {
        caller: { ...context.caller, roles: [FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER], agentId: null },
        agentId: frozen.agentId,
        now: at(context, -HOUR_MS),
      }),
    );
  }
};

const runMoney = async (context: SeedContext, agents: AgentActor[]) => {
  await attempt(context, 'unattributed purchase', () =>
    ingest(
      context,
      purchaseEventOf(
        context.runId,
        String(UNATTRIBUTED_PURCHASE_INDEX),
        platformUserIdOf(context.runId, UNATTRIBUTED_PURCHASE_INDEX),
        '250.00',
        null,
        at(context, -15 * DAY_MS),
      ),
    ),
  );
  // Stays Waiting for contact in the inbox: no contact ever has this id.
  await attempt(context, 'waiting purchase', () =>
    ingest(context, purchaseEventOf(context.runId, 'unknown', platformUserIdOf(context.runId, 999), '99.00', null, at(context, -HOUR_MS))),
  );

  // Day one of this Jalali month rolls up every earlier month, the same run the nightly job makes.
  const { year, month } = jalaliPartsOf(context.now);

  await attempt(context, 'monthly income rollup', () =>
    rollUpMonthlyIncomes(context.client, new Date(jalaliMonthStart(year, month).getTime() + HOUR_MS)),
  );

  const incomes = await listRecords<{ id: string; status: string }>(
    context.client,
    'monthlyIncomes',
    { agentId: { in: agents.map(({ agentId }) => agentId) } },
    { status: true },
  );
  const awaiting = incomes.filter(({ status }) => status === 'AWAITING_PAYMENT');

  if (awaiting.length > 0 && !incomes.some(({ status }) => status === 'PAID')) {
    await attempt(context, 'mark income paid', () =>
      markIncomesPaid({ client: context.client, metadata: context.metadata }, { caller: context.caller, incomeIds: [awaiting[0].id], now: context.now }),
    );
  }
};

export const seedShowcase = async ({
  client,
  metadata,
  caller,
  now,
}: Omit<SeedContext, 'runId' | 'platform' | 'warnings'>): Promise<SeedShowcaseResult> => {
  const context: SeedContext = {
    client,
    metadata,
    caller,
    now,
    runId: (await stage('Finding an earlier run', () => findShowcaseRunId(client))) ?? newShowcaseRunId(),
    platform: createFakePlatformClient(),
    warnings: [],
  };
  const agents = await stage('Creating agents', () => ensureAgents(context));

  if (agents.length === 0) {
    throw new Error('No workspace member is free to act as a showcase agent');
  }

  const codes = await stage('Creating codes', () => ensureCodes(context));
  const reasons = await stage('Loading reasons', () => loadReasons(context));

  await stage('Creating contacts', () => ensureContacts(context));
  await stage('Creating campaigns', () => ensureCampaigns(context, agents, codes));

  for (const script of SHOWCASE_SCRIPTS) {
    await stage(`Working contact ${script.index}`, () => runScript(context, script, agents, reasons, codes));
  }

  await stage('Supervisor actions', () => runSupervisorActions(context, agents));
  await stage('Purchases and incomes', () => runMoney(context, agents));
  await attempt(context, 'close expired deals', async () =>
    closeExpiredDeals(context.client, await loadEligibilityPlan(context.client, context.metadata), context.now),
  );
  await stage('Refreshing eligibility', () => runEligibilityRefresh(context.now, context.client, context.metadata));

  return { runId: context.runId, agents: agents.length, contacts: SHOWCASE_CONTACT_COUNT, warnings: context.warnings };
};
