import { isDefined } from 'twenty-sdk/utils';

import { type AgentActor } from 'src/logic-functions/utils/agent-actor.util';
import {
  activateCodes,
  loadOfferedCodes,
  type ActivationOutcome,
} from 'src/logic-functions/utils/code-activation.util';
import {
  loadCallContext,
  personDisplayName,
} from 'src/logic-functions/utils/call-context.util';
import {
  OPEN_DEAL_STAGES,
  dealClockFields,
  personMirrorFields,
} from 'src/logic-functions/utils/deal.util';
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

const invalid = (code: string, message: string) => new Refusal(422, code, message);

const callByKey = async (client: RecordsClient, idempotencyKey: string) =>
  (
    await listRecords<{ id: string; agentId: string | null }>(
      client,
      'calls',
      { idempotencyKey: { eq: idempotencyKey } },
      { agentId: true },
      1,
    )
  )[0] ?? null;

const loadReasons = (client: RecordsClient, ids: string[]) =>
  ids.length === 0
    ? Promise.resolve([] as ReasonRow[])
    : listRecords<ReasonRow>(client, 'reasons', { id: { in: ids } }, { kind: true, name: true, isActive: true, requiresText: true });

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
  let slotsToMove: number[] = [];

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

      if (outsidePlanReason === 'USER_REQUEST' && nextClock !== null) {
        slotsToMove = slotsEndingBefore(nextClock, now, nextCallAt);
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
  const lastCallSummary = [STATUS_LABELS[input.technicalStatus], reasonNames.join(', ')]
    .filter((part) => part !== '')
    .join(' · ')
    .slice(0, 200);
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

  const dealTypeLabel = kind === 'RETENTION' ? 'Retention' : deal?.dealType === 'REBUY' ? 'Rebuy' : 'Campaign';

  if (deal !== null && nextClock !== null) {
    const closesDeal = doNotContactReason !== null;
    const slots = nextClock.slots.map((status, index) => (slotsToMove.includes(index + 1) ? 'MOVED' : status));
    const dealData = closesDeal
      ? {
          dealStage: 'LOST',
          closeReason: 'DO_NOT_CONTACT',
          doNotContactReasonId: doNotContactReason?.id,
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

    if (written.length === 0) {
      throw new Refusal(409, 'FOLLOW_UP_ENDED', 'This follow-up has ended.');
    }
  } else if (isDefined(doNotContactReason)) {
    // A Customer is not an open deal: the DNC is recorded as a closed deal with no amount.
    await createRecord(client, 'Opportunity', {
      name: `${personDisplayName(person.name)} · Rebuy`,
      pointOfContactId: person.id,
      dealType: 'REBUY',
      dealStage: 'LOST',
      closeReason: 'DO_NOT_CONTACT',
      doNotContactReasonId: doNotContactReason.id,
      closeDate: now.toISOString(),
      openedAt: now.toISOString(),
      deadlineAt: now.toISOString(),
      amountUsdt: 0,
      ...agentLinks,
    });
  }

  const personData = isDefined(doNotContactReason)
    ? {
        lifecycleStage: 'DO_NOT_CONTACT',
        doNotContactReasonId: doNotContactReason.id,
        doNotContactAt: now.toISOString(),
        eligibleMemberIds: [],
        ...personMirrorFields({ clock: null, dealTypeLabel, nextCallAt: null, now }),
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

  if (personWritten.length === 0) {
    throw new Refusal(409, 'NOT_OWNER', 'You can only call contacts you follow up.');
  }

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
