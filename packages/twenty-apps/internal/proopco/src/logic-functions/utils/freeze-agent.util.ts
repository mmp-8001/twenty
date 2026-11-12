import { isString } from '@sniptt/guards';
import { isDefined } from 'twenty-sdk/utils';

import { DAY_MS } from 'src/constants/time.constant';
import { FROZEN_PLAN_PROGRESS } from 'src/utils/deal-clock.util';
import {
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  AuditAbort,
  createAudit,
  loadAudit,
  runAudit,
  type AuditContext,
  type AuditExecutor,
} from 'src/logic-functions/utils/audit-log.util';
import {
  OPEN_DEAL_STAGES,
  clockOfDeal,
  progressMirrorFields,
  type DealRow,
} from 'src/logic-functions/utils/deal.util';
import {
  loadEligibilityPlan,
  recomputeAllEligibility,
} from 'src/logic-functions/utils/eligibility.util';
import { loadMemberRoleIdentifiers } from 'src/logic-functions/utils/member-roles.util';
import {
  countRecords,
  createRecord,
  listRecords,
  updateRecord,
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';
import {
  freezeShiftMs,
  OPEN_DEAL_SELECTION,
  type BulkCaller,
} from 'src/logic-functions/utils/transfer-contacts.util';

export const LONG_FREEZE_DAYS = 7;

export const daysFrozenOf = (startedAt: string, now: Date) =>
  Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / DAY_MS));

type FreezeCaller = BulkCaller & { roles: string[]; agentId: string | null };

const recomputeEligibility = async ({ client, metadata }: AuditContext) =>
  recomputeAllEligibility(client, await loadEligibilityPlan(client, metadata));

const ownedContactCount = (client: RecordsClient, agentId: string) =>
  countRecords(client, 'people', { and: [{ ownerId: { eq: agentId } }, { deletedAt: { is: 'NULL' } }] });

const executeFreeze: AuditExecutor = async (context, audit) => {
  const { client } = context;
  const agentId = audit.subjectAgentId as string;
  const startedAt = audit.effectiveAt;

  await updateRecordsWhere(client, 'Agents', { and: [{ id: { eq: agentId } }, { frozenSince: { is: 'NULL' } }] }, { frozenSince: startedAt });

  const [agent] = await listRecords<{ name: string; frozenSince: string | null }>(client, 'agents', { id: { eq: agentId } }, { name: true, frozenSince: true }, 1);

  if (new Date(agent?.frozenSince ?? 0).getTime() !== new Date(startedAt).getTime()) {
    throw new AuditAbort('The agent was frozen by another operation.');
  }

  if (!isDefined(audit.freezePeriodId)) {
    // An earlier attempt may have created the period before it was linked.
    const [existing] = await listRecords<{ id: string }>(
      client,
      'freezePeriods',
      { and: [{ agentId: { eq: agentId } }, { startedAt: { eq: startedAt } }] },
      {},
      1,
    );
    const freezePeriodId =
      existing?.id ??
      (await createRecord(client, 'FreezePeriod', {
        name: `${agent.name} · ${startedAt.slice(0, 10)}`,
        agentId,
        startedAt,
        startedById: audit.actorId,
        daysFrozen: 0,
        waitingContacts: await ownedContactCount(client, agentId),
        longFreeze: false,
      }));

    await updateRecord(client, 'AuditLog', audit.id, { freezePeriodId });
  }

  await updateRecordsWhere(client, 'People', { and: [{ ownerId: { eq: agentId } }, { deletedAt: { is: 'NULL' } }] }, { planProgress: FROZEN_PLAN_PROGRESS });
  await recomputeEligibility(context);
};

type ShiftableDeal = DealRow & { pointOfContactId: string; lastFreezeShiftId: string | null };

// Shifts every open deal of the agent by the frozen time, guarded per deal so a rerun adds nothing twice.
const shiftOpenDeals = async (client: RecordsClient, agentId: string, frozenSince: string, auditId: string, effectiveAt: string) => {
  const deals = await listRecords<ShiftableDeal>(
    client,
    'opportunities',
    { and: [{ agentId: { eq: agentId } }, { openDealKey: { is: 'NOT_NULL' } }, { dealStage: { in: OPEN_DEAL_STAGES } }] },
    { ...OPEN_DEAL_SELECTION, pointOfContactId: true, lastFreezeShiftId: true },
  );
  const now = new Date(effectiveAt);

  for (const deal of deals) {
    const shiftMs = freezeShiftMs(frozenSince, deal.openedAt, effectiveAt);
    const deadlineAt = new Date(new Date(deal.deadlineAt).getTime() + shiftMs);
    const shifted = { ...deal, frozenMs: (deal.frozenMs ?? 0) + shiftMs, deadlineAt: deadlineAt.toISOString() };
    const [person] = await listRecords<{ nextCallAt: string | null; lastFreezeShiftId: string | null }>(
      client,
      'people',
      { id: { eq: deal.pointOfContactId } },
      { nextCallAt: true, lastFreezeShiftId: true },
      1,
    );

    // Person first, each side guarded by its own marker: a crash between the two writes repeats only the missing one.
    if (person?.lastFreezeShiftId !== auditId) {
      const nextCallAt = isDefined(person?.nextCallAt) ? new Date(new Date(person.nextCallAt).getTime() + shiftMs) : null;

      await updateRecordsWhere(
        client,
        'People',
        { and: [{ id: { eq: deal.pointOfContactId } }, person?.nextCallAt ? { nextCallAt: { eq: person.nextCallAt } } : { nextCallAt: { is: 'NULL' } }] },
        {
          deadlineAt: shifted.deadlineAt,
          nextCallAt: nextCallAt?.toISOString() ?? null,
          lastFreezeShiftId: auditId,
          ...progressMirrorFields({
            clock: deal.dealStage === 'REBUY_WINDOW' ? null : clockOfDeal(shifted),
            rebuyWindowDeadlineAt: deal.dealStage === 'REBUY_WINDOW' ? deadlineAt : null,
            nextCallAt,
            now,
          }),
        },
      );
    }

    if (deal.lastFreezeShiftId !== auditId) {
      await updateRecordsWhere(
        client,
        'Opportunities',
        { and: [{ id: { eq: deal.id } }, { deadlineAt: { eq: deal.deadlineAt } }] },
        { deadlineAt: shifted.deadlineAt, frozenMs: shifted.frozenMs, lastFreezeShiftId: auditId },
      );
    }
  }
};

const executeUnfreeze: AuditExecutor = async (context, audit) => {
  const { client } = context;
  const agentId = audit.subjectAgentId as string;
  const frozenSince = (audit.details as { frozenSince: string }).frozenSince;

  await shiftOpenDeals(client, agentId, frozenSince, audit.id, audit.effectiveAt);
  await updateRecordsWhere(
    client,
    'People',
    { and: [{ ownerId: { eq: agentId } }, { lifecycleStage: { eq: 'CUSTOMER' } }, { planProgress: { eq: FROZEN_PLAN_PROGRESS } }] },
    { planProgress: null },
  );
  await updateRecordsWhere(client, 'Agents', { and: [{ id: { eq: agentId } }, { frozenSince: { eq: frozenSince } }] }, { frozenSince: null });

  const [period] = await listRecords<{ id: string; startedAt: string }>(
    client,
    'freezePeriods',
    isDefined(audit.freezePeriodId)
      ? { id: { eq: audit.freezePeriodId } }
      : { and: [{ agentId: { eq: agentId } }, { endedAt: { is: 'NULL' } }] },
    { startedAt: true },
    1,
  );

  if (isDefined(period)) {
    await updateRecordsWhere(
      client,
      'FreezePeriods',
      { and: [{ id: { eq: period.id } }, { endedAt: { is: 'NULL' } }] },
      {
        endedAt: audit.effectiveAt,
        endedById: audit.actorId,
        daysFrozen: daysFrozenOf(period.startedAt, new Date(audit.effectiveAt)),
        longFreeze: daysFrozenOf(period.startedAt, new Date(audit.effectiveAt)) >= LONG_FREEZE_DAYS,
      },
    );
    await updateRecord(client, 'AuditLog', audit.id, { freezePeriodId: period.id });
  }

  await recomputeEligibility(context);
};

export const FREEZE_EXECUTORS = { FREEZE: executeFreeze, UNFREEZE: executeUnfreeze };

const requireAgentTarget = async (context: AuditContext, caller: FreezeCaller, agentId: unknown) => {
  if (!isString(agentId)) {
    throw new Refusal(400, 'INVALID_BODY', 'agentId is required');
  }

  if (caller.agentId === agentId) {
    throw new Refusal(403, 'SELF_FREEZE', 'You cannot freeze yourself.');
  }

  const [agent] = await listRecords<{ name: string; isActive: boolean; frozenSince: string | null }>(
    context.client,
    'agents',
    { id: { eq: agentId } },
    { name: true, isActive: true, frozenSince: true },
    1,
  );

  if (!isDefined(agent)) {
    throw new Refusal(404, 'AGENT_NOT_FOUND', 'Agent not found.');
  }

  const members = await listRecords<{ id: string }>(context.client, 'workspaceMembers', { agentId: { eq: agentId } }, {});
  const roles = await loadMemberRoleIdentifiers(context.metadata);
  const targetIsStaff = members.some(({ id }) => (roles.get(id) ?? []).includes(SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER));

  if (targetIsStaff && !caller.roles.includes(FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER)) {
    throw new Refusal(403, 'FULL_ADMIN_ONLY', 'Only a Full Admin can do this.');
  }

  return { agentId, ...agent };
};

export const freezeAgent = async (
  context: AuditContext,
  { caller, agentId, now }: { caller: FreezeCaller; agentId: unknown; now: Date },
) => {
  const agent = await requireAgentTarget(context, caller, agentId);

  if (!agent.isActive) {
    throw new Refusal(409, 'AGENT_INACTIVE', 'This agent is not active.');
  }

  if (isDefined(agent.frozenSince)) {
    throw new Refusal(409, 'ALREADY_FROZEN', 'This agent is already frozen.');
  }

  const auditId = await createAudit(
    context.client,
    { name: `Freeze · ${agent.name}`, action: 'FREEZE', actor: caller, effectiveAt: now, links: { subjectAgentId: agent.agentId } },
    'IN_PROGRESS',
  );
  const outcome = await runAudit(context, await loadAudit(context.client, auditId), executeFreeze);

  if (!outcome.ok) {
    throw new Refusal(503, 'OPERATION_FAILED', outcome.error);
  }

  return { agentId: agent.agentId };
};

export const unfreezeAgent = async (
  context: AuditContext,
  { caller, agentId, now }: { caller: FreezeCaller; agentId: unknown; now: Date },
) => {
  const agent = await requireAgentTarget(context, caller, agentId);

  if (!isDefined(agent.frozenSince)) {
    throw new Refusal(409, 'NOT_FROZEN', 'This agent is not frozen.');
  }

  const auditId = await createAudit(
    context.client,
    {
      name: `Unfreeze · ${agent.name}`,
      action: 'UNFREEZE',
      actor: caller,
      effectiveAt: now,
      links: { subjectAgentId: agent.agentId },
      details: { frozenSince: agent.frozenSince },
    },
    'IN_PROGRESS',
  );
  const outcome = await runAudit(context, await loadAudit(context.client, auditId), executeUnfreeze);

  if (!outcome.ok) {
    throw new Refusal(503, 'OPERATION_FAILED', outcome.error);
  }

  return { agentId: agent.agentId };
};

// Nightly: day counter and long-freeze tag on every open period.
export const refreshFreezePeriods = async (client: RecordsClient, now: Date): Promise<number> => {
  const periods = await listRecords<{ id: string; startedAt: string; agentId: string; daysFrozen: number; longFreeze: boolean }>(
    client,
    'freezePeriods',
    { endedAt: { is: 'NULL' } },
    { startedAt: true, agentId: true, daysFrozen: true, longFreeze: true },
  );
  let changed = 0;

  for (const period of periods) {
    const daysFrozen = daysFrozenOf(period.startedAt, now);
    const longFreeze = daysFrozen >= LONG_FREEZE_DAYS;

    if (daysFrozen !== period.daysFrozen || longFreeze !== period.longFreeze) {
      await updateRecord(client, 'FreezePeriod', period.id, {
        daysFrozen,
        longFreeze,
        waitingContacts: await ownedContactCount(client, period.agentId),
      });
      changed += 1;
    }
  }

  return changed;
};
