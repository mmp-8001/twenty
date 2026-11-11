import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-sdk/utils';

import { type RefusalCode } from 'src/constants/refusal-codes.constant';
import { type AgentActor } from 'src/logic-functions/utils/agent-actor.util';
import {
  activateCodes,
  loadOfferedCodes,
  type ActivationOutcome,
} from 'src/logic-functions/utils/code-activation.util';
import { rewriteContactOwner } from 'src/logic-functions/utils/contact-owner.util';
import {
  loadCallContext,
  personDisplayName,
  type CallContactRow,
} from 'src/logic-functions/utils/call-context.util';
import {
  OPEN_DEAL_STAGES,
  clockOfDeal,
  dealClockFields,
  loadOpenDeal,
  personMirrorFields,
  type DealRow,
} from 'src/logic-functions/utils/deal.util';
import { recountOwnedContacts } from 'src/logic-functions/utils/recount-owned-contacts.util';
import {
  createPlatformClient,
  type PlatformClient,
} from 'src/logic-functions/utils/platform-client.util';
import {
  createRecord,
  listRecords,
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';
import {
  applyCall,
  requiresOutsidePlanReason,
  slotsEndingBefore,
  type DealClock,
} from 'src/utils/deal-clock.util';

const TECHNICAL_STATUSES = ['ANSWERED', 'NO_ANSWER', 'BUSY', 'SWITCHED_OFF', 'REJECTED', 'INVALID_NUMBER'];
const STATUS_LABELS: Record<string, string> = {
  ANSWERED: 'Answered',
  NO_ANSWER: 'No answer',
  BUSY: 'Busy',
  SWITCHED_OFF: 'Switched off',
  REJECTED: 'Rejected',
  INVALID_NUMBER: 'Invalid number',
};
const OUTSIDE_PLAN_REASONS = ['USER_REQUEST', 'ADMIN_DECISION'];

export type LogCallInput = {
  personId: string;
  idempotencyKey: string;
  technicalStatus: string;
  reasonIds?: string[];
  otherReasonText?: string | null;
  next:
    | { mode: 'schedule'; at: string; outsidePlanReason?: string | null }
    | { mode: 'none' }
    | { mode: 'doNotContact'; reasonId: string };
  note?: string | null;
  codeIds?: string[];
};

export type LogCallResult = { callId: string; repeated: boolean; activations: ActivationOutcome[] };

type ReasonRow = { id: string; kind: string; name: string; isActive: boolean; requiresText: boolean };

const invalid = (code: RefusalCode, message: string) => new Refusal(422, code, message);

type SavedCall = {
  id: string;
  agentId: string | null;
  contactId: string;
  callKind: 'FOLLOW_UP' | 'RETENTION';
  calledAt: string;
  answered: boolean;
  technicalStatus: string;
  nextCallAt: string | null;
  outsidePlanReason: string | null;
  otherReasonText: string | null;
  doNotContactReasonId: string | null;
  callReasons: { edges: { node: { reason: { name: string } | null } }[] };
};

const callByKey = async (client: RecordsClient, idempotencyKey: string) =>
  (
    await listRecords<SavedCall>(
      client,
      'calls',
      { idempotencyKey: { eq: idempotencyKey } },
      {
        agentId: true,
        contactId: true,
        callKind: true,
        calledAt: true,
        answered: true,
        technicalStatus: true,
        nextCallAt: true,
        outsidePlanReason: true,
        otherReasonText: true,
        doNotContactReasonId: true,
        callReasons: { edges: { node: { reason: { name: true } } } },
      },
      1,
    )
  )[0] ?? null;

const loadReasons = (client: RecordsClient, ids: string[]) =>
  ids.length === 0
    ? Promise.resolve([] as ReasonRow[])
    : listRecords<ReasonRow>(client, 'reasons', { id: { in: ids } }, { kind: true, name: true, isActive: true, requiresText: true });

type OutcomeInput = {
  client: RecordsClient;
  actor: AgentActor;
  person: Pick<CallContactRow, 'id' | 'name'>;
  kind: 'FOLLOW_UP' | 'RETENTION';
  deal: DealRow | null;
  now: Date;
  answered: boolean;
  nextCallAt: Date | null;
  outsidePlanReason: string | null;
  doNotContactReasonId: string | null;
  lastCallSummary: string;
  replay: boolean;
};

// Every write here is conditional on the state the call saw, so a retry after a crash can run it again; `replay` tolerates writes that already landed.
const applyCallOutcome = async ({
  client,
  actor,
  person,
  kind,
  deal,
  now,
  answered,
  nextCallAt,
  outsidePlanReason,
  doNotContactReasonId,
  lastCallSummary,
  replay,
}: OutcomeInput) => {
  const clock = deal === null ? null : clockOfDeal(deal);
  const applied = clock === null ? null : applyCall(clock, { now, answered });
  const nextClock: DealClock | null = applied?.clock ?? null;
  const closesContact = isDefined(doNotContactReasonId);
  const slotsToMove =
    outsidePlanReason === 'USER_REQUEST' && nextClock !== null && nextCallAt !== null
      ? slotsEndingBefore(nextClock, now, nextCallAt)
      : [];
  const dealTypeLabel = kind === 'RETENTION' ? 'Retention' : deal?.dealType === 'REBUY' ? 'Rebuy' : 'Campaign';

  if (kind === 'FOLLOW_UP' && deal !== null && nextClock !== null) {
    const slots = nextClock.slots.map((status, index) => (slotsToMove.includes(index + 1) ? 'MOVED' : status));
    const dealData = closesContact
      ? {
          dealStage: 'LOST',
          closeReason: 'DO_NOT_CONTACT',
          doNotContactReasonId,
          closeDate: now.toISOString(),
          openDealKey: null,
        }
      : dealClockFields({ ...nextClock, slots: slots as typeof nextClock.slots }, applied?.slotNumber ?? null);
    const written = await updateRecordsWhere(
      client,
      'Opportunities',
      {
        and: [
          { id: { eq: deal.id } },
          { dealStage: { in: OPEN_DEAL_STAGES } },
          { deadlineAt: { eq: deal.deadlineAt } },
        ],
      },
      dealData,
    );

    if (written.length === 0 && !replay) {
      throw new Refusal(409, 'FOLLOW_UP_ENDED', 'This follow-up has ended.');
    }
  } else if (kind === 'RETENTION' && closesContact) {
    const [existing] = await listRecords<{ id: string }>(
      client,
      'opportunities',
      {
        and: [
          { pointOfContactId: { eq: person.id } },
          { closeReason: { eq: 'DO_NOT_CONTACT' } },
          { closeDate: { eq: now.toISOString() } },
        ],
      },
      {},
      1,
    );

    // A Customer is not an open deal: the DNC is a closed deal, amount 0. Dealt as CAMPAIGN without a campaign so
    // the Report counts it in the Retention row, never in Rebuy.
    if (!isDefined(existing)) {
      await createRecord(client, 'Opportunity', {
        name: `${personDisplayName(person.name)} · Retention`,
        pointOfContactId: person.id,
        dealType: 'CAMPAIGN',
        dealStage: 'LOST',
        closeReason: 'DO_NOT_CONTACT',
        doNotContactReasonId,
        closeDate: now.toISOString(),
        openedAt: now.toISOString(),
        deadlineAt: now.toISOString(),
        amountUsdt: 0,
        agentId: actor.agentId,
        agentMemberId: actor.memberId,
        contactOwnerId: actor.agentId,
        contactOwnerMemberId: actor.memberId,
      });
    }
  }

  const personData = closesContact
    ? {
        lifecycleStage: 'DO_NOT_CONTACT',
        doNotContactReasonId,
        doNotContactAt: now.toISOString(),
        eligibleMemberIds: [],
        ownerId: null,
        ownerMemberId: null,
        ownedSince: null,
        cooldownUntil: null,
        ...personMirrorFields({ clock: null, dealTypeLabel, sourceCampaignId: null, nextCallAt: null, now }),
      }
    : {
        ...(nextClock?.stage === 'IN_FOLLOW_UP' ? { lifecycleStage: 'IN_FOLLOW_UP' } : {}),
        ...personMirrorFields({ clock: nextClock, dealTypeLabel, nextCallAt, now }),
      };
  const personWritten = await updateRecordsWhere(
    client,
    'People',
    { and: [{ id: { eq: person.id } }, { ownerId: { eq: actor.agentId } }] },
    { ...personData, lastCallAt: now.toISOString(), lastCallSummary },
  );

  if (personWritten.length === 0 && !replay) {
    throw new Refusal(409, 'NOT_OWNER', 'You can only call contacts you follow up.');
  }

  if (closesContact) {
    await rewriteContactOwner(client, person.id, actor.agentId, null);
    await recountOwnedContacts(client, actor.agentId);
  }
};

const summaryOf = (technicalStatus: string, reasonNames: string[]) =>
  [STATUS_LABELS[technicalStatus], reasonNames.join(', ')]
    .filter((part) => part !== '')
    .join(' · ')
    .slice(0, 200);

// The call row exists, so the retry redoes the deal and contact writes from it instead of the validation the save already passed.
const replaySavedCall = async (client: RecordsClient, actor: AgentActor, saved: SavedCall) => {
  const [person] = await listRecords<{ id: string; name: CallContactRow['name'] }>(
    client,
    'people',
    { id: { eq: saved.contactId } },
    { name: { firstName: true, lastName: true } },
    1,
  );

  if (!isDefined(person)) {
    return;
  }

  const openDeal = saved.callKind === 'FOLLOW_UP' ? await loadOpenDeal(client, person.id) : null;
  const reasonNames = [
    ...saved.callReasons.edges.flatMap(({ node }) => (node.reason ? [node.reason.name] : [])),
    ...(isNonEmptyString(saved.otherReasonText) ? [saved.otherReasonText] : []),
  ];

  await applyCallOutcome({
    client,
    actor,
    person,
    kind: saved.callKind,
    deal: openDeal,
    now: new Date(saved.calledAt),
    answered: saved.answered,
    nextCallAt: isDefined(saved.nextCallAt) ? new Date(saved.nextCallAt) : null,
    outsidePlanReason: saved.outsidePlanReason,
    doNotContactReasonId: saved.doNotContactReasonId,
    lastCallSummary: summaryOf(saved.technicalStatus, reasonNames),
    replay: true,
  });
};

export const logCall = async (
  client: RecordsClient,
  actor: AgentActor,
  input: LogCallInput,
  now: Date,
  platform: PlatformClient = createPlatformClient(),
): Promise<LogCallResult> => {
  if (!isDefined(input.idempotencyKey) || input.idempotencyKey.trim() === '') {
    throw invalid('IDEMPOTENCY_KEY_REQUIRED', 'An idempotency key is required.');
  }

  // A repeat of a saved call must not hit the refusals its own save caused (the contact has moved on).
  const existing = await callByKey(client, input.idempotencyKey);

  if (isDefined(existing)) {
    if (existing.agentId !== actor.agentId) {
      throw new Refusal(409, 'IDEMPOTENCY_KEY_TAKEN', 'This key belongs to another call.');
    }

    await replaySavedCall(client, actor, existing);

    return { callId: existing.id, repeated: true, activations: [] };
  }

  const { person, kind, deal, clock } = await loadCallContext(client, actor, input.personId, now);

  if (!TECHNICAL_STATUSES.includes(input.technicalStatus)) {
    throw invalid('INVALID_STATUS', 'Choose what happened on the call.');
  }

  const answered = input.technicalStatus === 'ANSWERED';
  const reasonIds = [...new Set(input.reasonIds ?? [])];
  const otherText = (input.otherReasonText ?? '').trim();
  const reasons = await loadReasons(client, reasonIds);

  if (reasons.length !== reasonIds.length || reasons.some(({ isActive, kind: reasonKind }) => !isActive || reasonKind === 'DO_NOT_CONTACT')) {
    throw invalid('INVALID_REASON', 'Choose active satisfaction or dissatisfaction reasons.');
  }

  if (!answered && (reasonIds.length > 0 || otherText !== '')) {
    throw invalid('REASONS_NOT_ALLOWED', 'An unanswered call has no reasons.');
  }

  if (answered && reasonIds.length === 0 && otherText === '') {
    throw invalid('REASON_REQUIRED', 'Choose at least one reason.');
  }

  if (reasons.some(({ requiresText }) => requiresText) && otherText === '') {
    throw invalid('REASON_TEXT_REQUIRED', 'This reason needs a text.');
  }

  const applied = clock === null ? null : applyCall(clock, { now, answered });
  const nextClock = applied?.clock ?? null;
  let nextCallAt: Date | null = null;
  let outsidePlanReason: string | null = null;
  let doNotContactReason: ReasonRow | null = null;

  if (input.next.mode === 'doNotContact') {
    [doNotContactReason] = await loadReasons(client, [input.next.reasonId]);

    if (!isDefined(doNotContactReason) || !doNotContactReason.isActive || doNotContactReason.kind !== 'DO_NOT_CONTACT') {
      throw invalid('DO_NOT_CONTACT_REASON_REQUIRED', 'Choose a do-not-contact reason.');
    }
  } else if (input.next.mode === 'none') {
    if (kind !== 'RETENTION' || !answered) {
      throw invalid('NEXT_CALL_REQUIRED', 'Choose the next call time.');
    }
  } else {
    nextCallAt = new Date(input.next.at);

    if (Number.isNaN(nextCallAt.getTime()) || nextCallAt <= now) {
      throw invalid('NEXT_CALL_INVALID', 'Choose a next call time in the future.');
    }

    if (nextClock !== null && nextCallAt > nextClock.deadlineAt) {
      throw invalid('NEXT_CALL_AFTER_DEADLINE', 'The next call cannot be after the deadline.');
    }

    if (requiresOutsidePlanReason(nextClock, now, nextCallAt)) {
      outsidePlanReason = input.next.outsidePlanReason ?? null;

      if (!isDefined(outsidePlanReason) || !OUTSIDE_PLAN_REASONS.includes(outsidePlanReason)) {
        throw invalid('OUTSIDE_PLAN_REASON_REQUIRED', 'A time outside the plan needs a reason.');
      }

    }
  }

  const codeIds = [...new Set(input.codeIds ?? [])];

  if (codeIds.length > 0) {
    if (!answered || isDefined(doNotContactReason)) {
      throw invalid('CODES_NOT_ALLOWED', 'Codes are offered only after an answered call that continues.');
    }

    const offered = await loadOfferedCodes(client, { kind, deal, personId: person.id, now });

    if (codeIds.some((codeId) => !offered.some(({ id, activated }) => id === codeId && !activated))) {
      throw invalid('CODE_NOT_AVAILABLE', 'Choose codes that are offered and not yet activated for this contact.');
    }
  }

  const note = (input.note ?? '').trim();
  const reasonNames = [...reasons.map(({ name }) => name), ...(otherText === '' ? [] : [otherText])];
  const lastCallSummary = summaryOf(input.technicalStatus, reasonNames);
  const agentLinks = {
    agentId: actor.agentId,
    agentMemberId: actor.memberId,
    contactOwnerId: actor.agentId,
    contactOwnerMemberId: actor.memberId,
  };

  let callId: string;

  try {
    callId = await createRecord(client, 'Call', {
      name: `${personDisplayName(person.name)} · ${now.toISOString().slice(0, 16)}`,
      calledAt: now.toISOString(),
      ...agentLinks,
      contactId: person.id,
      dealId: deal?.id ?? null,
      callKind: kind,
      technicalStatus: input.technicalStatus,
      answered,
      note: note === '' ? null : note,
      nextCallAt: nextCallAt?.toISOString() ?? null,
      outsidePlanReason,
      otherReasonText: otherText === '' ? null : otherText,
      doNotContactReasonId: doNotContactReason?.id ?? null,
      slotNumber: applied?.slotNumber ?? null,
      completedSlot: applied?.completedSlot ?? null,
      wasOverdue: person.callUrgency === 'OVERDUE',
      idempotencyKey: input.idempotencyKey,
    });
  } catch (error) {
    // A concurrent submit with the same key already saved it.
    const landed = await callByKey(client, input.idempotencyKey);

    if (isDefined(landed)) {
      return { callId: landed.id, repeated: true, activations: [] };
    }

    throw error;
  }

  for (const reason of reasons) {
    await createRecord(client, 'CallReason', {
      name: reason.name,
      callId,
      reasonId: reason.id,
    });
  }

  await applyCallOutcome({
    client,
    actor,
    person,
    kind,
    deal,
    now,
    answered,
    nextCallAt,
    outsidePlanReason,
    doNotContactReasonId: doNotContactReason?.id ?? null,
    lastCallSummary,
    replay: false,
  });

  // The call is saved by now; an activation failure is a Failed row to retry, never an error for the save.
  const activations = await activateCodes(client, platform, {
    actor,
    person: { id: person.id, displayName: personDisplayName(person.name) },
    callId,
    dealId: deal?.id ?? null,
    codeIds,
    now,
  });

  return { callId, repeated: false, activations };
};
