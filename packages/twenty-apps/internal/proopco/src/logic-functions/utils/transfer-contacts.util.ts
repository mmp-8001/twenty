import { isDefined } from 'twenty-sdk/utils';

import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
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
import { personDisplayName } from 'src/logic-functions/utils/call-context.util';
import {
  clockOfDeal,
  loadOpenDeal,
  personMirrorFields,
  progressMirrorFields,
  type DealRow,
} from 'src/logic-functions/utils/deal.util';
import {
  loadEligibilityPlan,
  recomputeContactEligibility,
} from 'src/logic-functions/utils/eligibility.util';
import { loadMemberRoleIdentifiers } from 'src/logic-functions/utils/member-roles.util';
import { recountOwnedContacts } from 'src/logic-functions/utils/recount-owned-contacts.util';
import {
  createRecord,
  listRecords,
  updateRecord,
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';

export const MAX_BULK_CONTACTS = 50;

export type BulkCaller = { memberId: string; name: string };
export type BulkResult = {
  succeeded: string[];
  failed: { personId: string; code: string; message: string }[];
};

type DealSnapshot = DealRow & {
  name: string;
  currentSlot: number | null;
  agentMemberId: string | null;
};

type TransferDetails = {
  toMemberId: string | null;
  fromFrozenSince: string | null;
  deal: DealSnapshot | null;
  nextCallAt: string | null;
  dealTypeLabel: string | null;
};

const DEAL_FIELDS = {
  name: true,
  dealType: true,
  dealStage: true,
  openedAt: true,
  firstAnsweredCallAt: true,
  deadlineAt: true,
  frozenMs: true,
  currentSlot: true,
  sourceCampaignId: true,
  agentMemberId: true,
  slot1Status: true,
  slot2Status: true,
  slot3Status: true,
  slot4Status: true,
  slot5Status: true,
};

export const OPEN_DEAL_SELECTION = DEAL_FIELDS;

// Collections that carry a contactOwner copy; every owner change rewrites all four (spec 5).
const OWNER_COPIES = [
  { plural: 'Calls', contactField: 'contactId' },
  { plural: 'Opportunities', contactField: 'pointOfContactId' },
  { plural: 'CodeActivations', contactField: 'contactId' },
  { plural: 'Purchases', contactField: 'contactId' },
];

const rewriteContactOwner = async (
  client: RecordsClient,
  personId: string,
  fromAgentId: string,
  to: { agentId: string; memberId: string | null } | null,
) => {
  for (const { plural, contactField } of OWNER_COPIES) {
    await updateRecordsWhere(
      client,
      plural,
      { and: [{ [contactField]: { eq: personId } }, { contactOwnerId: { eq: fromAgentId } }] },
      { contactOwnerId: to?.agentId ?? null, contactOwnerMemberId: to?.memberId ?? null },
    );
  }
};

// Time the deal would have gained had the frozen owner been unfrozen at `effectiveAt`.
export const freezeShiftMs = (
  frozenSince: string | null,
  openedAt: string,
  effectiveAt: string,
): number =>
  frozenSince === null
    ? 0
    : Math.max(
        0,
        new Date(effectiveAt).getTime() -
          Math.max(new Date(frozenSince).getTime(), new Date(openedAt).getTime()),
      );

const closeOldDeal = (client: RecordsClient, dealId: string, closeReason: string, effectiveAt: string) =>
  updateRecordsWhere(
    client,
    'Opportunities',
    { and: [{ id: { eq: dealId } }, { openDealKey: { is: 'NOT_NULL' } }] },
    { dealStage: 'VOID', closeReason, closeDate: effectiveAt, openDealKey: null },
  );

const personStillOwnedBy = async (client: RecordsClient, personId: string, agentId: string | null) => {
  const [person] = await listRecords<{ ownerId: string | null }>(
    client,
    'people',
    { id: { eq: personId } },
    { ownerId: true },
    1,
  );

  return isDefined(person) && (person.ownerId ?? null) === agentId;
};

const executeTransfer: AuditExecutor = async ({ client }, audit) => {
  const details = audit.details as unknown as TransferDetails;
  const personId = audit.contactId as string;
  const fromAgentId = audit.fromAgentId as string;
  const toAgentId = audit.toAgentId as string;
  const { deal } = details;
  const shiftMs = deal === null ? 0 : freezeShiftMs(details.fromFrozenSince, deal.openedAt, audit.effectiveAt);

  const moved = await updateRecordsWhere(
    client,
    'People',
    { and: [{ id: { eq: personId } }, { ownerId: { eq: fromAgentId } }] },
    { ownerId: toAgentId, ownerMemberId: details.toMemberId },
  );

  if (moved.length === 0 && !(await personStillOwnedBy(client, personId, toAgentId))) {
    throw new AuditAbort('The contact is no longer owned by the source agent.');
  }

  if (deal !== null) {
    await closeOldDeal(client, deal.id, 'TRANSFERRED', audit.effectiveAt);

    if (!isDefined(audit.newDealId)) {
      const deadlineAt = new Date(new Date(deal.deadlineAt).getTime() + shiftMs);
      const frozenMs = (deal.frozenMs ?? 0) + shiftMs;
      // After the old deal released the open-deal key, any open deal is the one an earlier attempt created.
      const landed = await loadOpenDeal(client, personId);
      const newDealId =
        landed?.id ??
        (await createRecord(client, 'Opportunity', {
          name: deal.name,
          pointOfContactId: personId,
          dealType: deal.dealType,
          dealStage: deal.dealStage,
          openDealKey: personId,
          openedAt: deal.openedAt,
          firstAnsweredCallAt: deal.firstAnsweredCallAt,
          deadlineAt: deadlineAt.toISOString(),
          frozenMs,
          currentSlot: deal.currentSlot,
          sourceCampaignId: deal.sourceCampaignId,
          slot1Status: deal.slot1Status,
          slot2Status: deal.slot2Status,
          slot3Status: deal.slot3Status,
          slot4Status: deal.slot4Status,
          slot5Status: deal.slot5Status,
          agentId: toAgentId,
          agentMemberId: details.toMemberId,
          contactOwnerId: toAgentId,
          contactOwnerMemberId: details.toMemberId,
        }));

      await updateRecord(client, 'AuditLog', audit.id, { newDealId, closedDealId: deal.id });
    }

    const now = new Date(audit.effectiveAt);
    const nextCallAt = isDefined(details.nextCallAt)
      ? new Date(new Date(details.nextCallAt).getTime() + shiftMs)
      : null;
    const shifted = { ...deal, frozenMs: (deal.frozenMs ?? 0) + shiftMs, deadlineAt: new Date(new Date(deal.deadlineAt).getTime() + shiftMs).toISOString() };

    await updateRecord(client, 'Person', personId, {
      deadlineAt: shifted.deadlineAt,
      ...progressMirrorFields({
        clock: deal.dealStage === 'REBUY_WINDOW' ? null : clockOfDeal(shifted),
        rebuyWindowDeadlineAt: deal.dealStage === 'REBUY_WINDOW' ? new Date(shifted.deadlineAt) : null,
        nextCallAt,
        now,
      }),
      nextCallAt: nextCallAt?.toISOString() ?? null,
    });
  }

  await rewriteContactOwner(client, personId, fromAgentId, { agentId: toAgentId, memberId: details.toMemberId });
  await recountOwnedContacts(client, fromAgentId);
  await recountOwnedContacts(client, toAgentId);
};

const executeRelease: AuditExecutor = async ({ client, metadata }, audit) => {
  const details = audit.details as unknown as TransferDetails;
  const personId = audit.contactId as string;
  const fromAgentId = audit.fromAgentId as string;
  const now = new Date(audit.effectiveAt);
  const released = await updateRecordsWhere(
    client,
    'People',
    { and: [{ id: { eq: personId } }, { ownerId: { eq: fromAgentId } }] },
    {
      ownerId: null,
      ownerMemberId: null,
      ownedSince: null,
      lifecycleStage: 'FREE',
      cooldownUntil: null,
      ...personMirrorFields({ clock: null, dealTypeLabel: null, sourceCampaignId: null, nextCallAt: null, now }),
    },
  );

  if (released.length === 0 && !(await personStillOwnedBy(client, personId, null))) {
    throw new AuditAbort('The contact is no longer owned by the source agent.');
  }

  if (details.deal !== null) {
    await closeOldDeal(client, details.deal.id, 'RELEASED', audit.effectiveAt);
    await updateRecord(client, 'AuditLog', audit.id, { closedDealId: details.deal.id });
  }

  await rewriteContactOwner(client, personId, fromAgentId, null);
  await recomputeContactEligibility(client, await loadEligibilityPlan(client, metadata), personId);
  await recountOwnedContacts(client, fromAgentId);
};

export const EXECUTORS_BY_ACTION = { TRANSFER: executeTransfer, RELEASE: executeRelease };

type PersonRow = {
  name: { firstName: string; lastName: string } | null;
  lifecycleStage: string;
  ownerId: string | null;
  nextCallAt: string | null;
  dealTypeLabel: string | null;
};

type Prepared = { person: PersonRow; fromFrozenSince: string | null; deal: DealSnapshot | null };

const prepareContact = async (
  client: RecordsClient,
  personId: string,
  now: Date,
  toAgentId: string | null,
): Promise<Prepared> => {
  const [person] = await listRecords<PersonRow>(
    client,
    'people',
    { and: [{ id: { eq: personId } }, { deletedAt: { is: 'NULL' } }] },
    { name: { firstName: true, lastName: true }, lifecycleStage: true, ownerId: true, nextCallAt: true, dealTypeLabel: true },
    1,
  );

  if (!isDefined(person)) {
    throw new Refusal(404, 'CONTACT_NOT_FOUND', 'Contact not found.');
  }

  if (!isDefined(person.ownerId)) {
    throw new Refusal(409, 'NOT_OWNED', 'This contact has no owner.');
  }

  if (person.ownerId === toAgentId) {
    throw new Refusal(409, 'ALREADY_OWNER', 'The target already owns this contact.');
  }

  const [owner] = await listRecords<{ frozenSince: string | null }>(
    client,
    'agents',
    { id: { eq: person.ownerId } },
    { frozenSince: true },
    1,
  );
  const fromFrozenSince = owner?.frozenSince ?? null;
  const deal = (await listRecords<DealSnapshot>(
    client,
    'opportunities',
    { openDealKey: { eq: personId } },
    OPEN_DEAL_SELECTION,
    1,
  ))[0] ?? null;

  if (deal !== null) {
    const shiftMs = freezeShiftMs(fromFrozenSince, deal.openedAt, now.toISOString());

    if (new Date(deal.deadlineAt).getTime() + shiftMs <= now.getTime()) {
      throw new Refusal(409, 'FOLLOW_UP_ENDED', 'This follow-up has ended.');
    }
  }

  return { person, fromFrozenSince, deal };
};

const validateBulk = (personIds: unknown, reason: unknown) => {
  const ids = Array.isArray(personIds) ? [...new Set(personIds.filter((id): id is string => typeof id === 'string'))] : [];

  if (ids.length === 0 || ids.length > MAX_BULK_CONTACTS) {
    throw new Refusal(422, 'INVALID_SELECTION', `Choose between 1 and ${MAX_BULK_CONTACTS} contacts.`);
  }

  if (typeof reason !== 'string' || reason.trim() === '') {
    throw new Refusal(422, 'REASON_REQUIRED', 'A reason is required.');
  }

  return { ids, reason: reason.trim() };
};

const loadTarget = async (context: AuditContext, toAgentId: unknown) => {
  if (typeof toAgentId !== 'string') {
    throw new Refusal(400, 'INVALID_BODY', 'toAgentId is required');
  }

  const [agent] = await listRecords<{ isActive: boolean; frozenSince: string | null }>(
    context.client,
    'agents',
    { id: { eq: toAgentId } },
    { isActive: true, frozenSince: true },
    1,
  );

  if (!isDefined(agent) || !agent.isActive) {
    throw new Refusal(409, 'TARGET_INACTIVE', 'Choose an active agent.');
  }

  if (isDefined(agent.frozenSince)) {
    throw new Refusal(409, 'TARGET_FROZEN', 'A frozen agent cannot receive contacts.');
  }

  const members = await listRecords<{ id: string }>(context.client, 'workspaceMembers', { agentId: { eq: toAgentId } }, {});
  const roles = await loadMemberRoleIdentifiers(context.metadata);
  const memberId = members.find(({ id }) =>
    (roles.get(id) ?? []).some((role) => [AGENT_ROLE_UNIVERSAL_IDENTIFIER, SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER].includes(role)),
  )?.id;

  if (!isDefined(memberId)) {
    throw new Refusal(409, 'TARGET_ROLE', 'The target must have the Agent or Supervisor role.');
  }

  return { toAgentId, toMemberId: memberId };
};

const runBulk = async (
  context: AuditContext,
  action: 'TRANSFER' | 'RELEASE',
  {
    caller,
    ids,
    reason,
    toAgentId,
    toMemberId,
    now,
  }: { caller: BulkCaller; ids: string[]; reason: string; toAgentId: string | null; toMemberId: string | null; now: Date },
): Promise<BulkResult> => {
  const result: BulkResult = { succeeded: [], failed: [] };

  for (const personId of ids) {
    try {
      const { person, fromFrozenSince, deal } = await prepareContact(context.client, personId, now, toAgentId);
      const details: TransferDetails = {
        toMemberId,
        fromFrozenSince,
        deal,
        nextCallAt: person.nextCallAt,
        dealTypeLabel: person.dealTypeLabel,
      };
      const auditId = await createAudit(
        context.client,
        {
          name: `${action === 'TRANSFER' ? 'Transfer' : 'Release'} · ${personDisplayName(person.name)}`,
          action,
          actor: caller,
          reason,
          effectiveAt: now,
          links: { contactId: personId, fromAgentId: person.ownerId, toAgentId },
          details: details as unknown as Record<string, unknown>,
        },
        'IN_PROGRESS',
      );
      const outcome = await runAudit(context, await loadAudit(context.client, auditId), EXECUTORS_BY_ACTION[action]);

      if (outcome.ok) {
        result.succeeded.push(personId);
      } else {
        result.failed.push({ personId, code: 'OPERATION_FAILED', message: outcome.error });
      }
    } catch (error) {
      if (!(error instanceof Refusal)) {
        throw error;
      }

      result.failed.push({ personId, code: error.code, message: error.message });
    }
  }

  return result;
};

export const transferContacts = async (
  context: AuditContext,
  input: { caller: BulkCaller; personIds: unknown; toAgentId: unknown; reason: unknown; now: Date },
): Promise<BulkResult> => {
  const { ids, reason } = validateBulk(input.personIds, input.reason);
  const target = await loadTarget(context, input.toAgentId);

  return runBulk(context, 'TRANSFER', { caller: input.caller, ids, reason, ...target, now: input.now });
};

export const releaseContacts = async (
  context: AuditContext,
  input: { caller: BulkCaller; personIds: unknown; reason: unknown; now: Date },
): Promise<BulkResult> => {
  const { ids, reason } = validateBulk(input.personIds, input.reason);

  return runBulk(context, 'RELEASE', { caller: input.caller, ids, reason, toAgentId: null, toMemberId: null, now: input.now });
};
