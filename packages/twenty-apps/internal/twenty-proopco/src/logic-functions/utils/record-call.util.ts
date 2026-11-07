import { isString } from '@sniptt/guards';

import {
  deadlineAfterCall,
  isAnsweredStatus,
  planFirstAnsweredCall,
  planMoveToFailed,
  type CallFormInput,
  validateCallForm,
} from 'src/logic-functions/utils/call-flow.util';
import {
  createRecord,
  listRecords,
  type RecordsClient,
  updateRecord,
} from 'src/logic-functions/utils/list-records.util';
import { recomputeVisibility } from 'src/logic-functions/utils/recompute-visibility.util';

export type RecordCallResult =
  | { success: true; callId: string }
  | { success: false; error: string };

type FollowupNode = {
  id: string;
  status: string | null;
  deadlineAt: string | null;
};

type OwnershipNode = { id: string; state: string | null; adminId: string | null };

const fail = (error: string): RecordCallResult => ({ success: false, error });

const readText = (value: unknown) => (isString(value) && value.trim() !== '' ? value : null);

export const readCallFormInput = (body: unknown): { personId: string; input: CallFormInput } | null => {
  const { personId, technicalStatus, feedbackReasonIds, ...rest } = (body ?? {}) as Record<string, unknown>;

  if (!isString(personId) || !isString(technicalStatus)) {
    return null;
  }

  return {
    personId,
    input: {
      technicalStatus,
      feedbackReasonIds: Array.isArray(feedbackReasonIds) ? feedbackReasonIds.filter(isString) : [],
      note: readText(rest.note),
      feedbackOtherText: readText(rest.feedbackOtherText),
      nextCallAt: readText(rest.nextCallAt),
      offScheduleReason: readText(rest.offScheduleReason),
      failureReasonId: readText(rest.failureReasonId),
    },
  };
};

export const recordCall = async ({
  client,
  memberId,
  personId,
  input,
  now = new Date(),
}: {
  client: RecordsClient;
  memberId: string;
  personId: string;
  input: CallFormInput;
  now?: Date;
}): Promise<RecordCallResult> => {
  const [person] = await listRecords<{ currentOwnerId: string | null }>(
    client,
    'people',
    { id: { eq: personId } },
    { currentOwnerId: true },
  );

  // CALL-01: only the owner calls, and the message does not say who owns the User otherwise.
  if (!person || person.currentOwnerId !== memberId) {
    return fail('You can only call users in your follow-up list');
  }

  const [ownership] = await listRecords<OwnershipNode>(
    client,
    'ownerships',
    { openUserKey: { eq: personId } },
    { state: true, adminId: true },
  );
  const [followup] = await listRecords<FollowupNode>(
    client,
    'followups',
    { openKey: { eq: personId } },
    { status: true, deadlineAt: true },
  );

  if (!ownership || ownership.adminId !== memberId) {
    return fail('You can only call users in your follow-up list');
  }

  const canCallFollowup =
    followup && ['PENDING_FIRST_CALL', 'IN_PROGRESS'].includes(followup.status ?? '');
  const isRetention = !followup && ownership.state === 'SUCCESSFUL';

  if (!canCallFollowup && !isRetention) {
    return fail('This user cannot be called now');
  }

  const kind = canCallFollowup ? 'FOLLOWUP' : 'RETENTION';
  const isAnswered = isAnsweredStatus(input.technicalStatus);
  const feedbackReasons = new Map<string, { isActive: boolean; isOther: boolean }>();

  if (input.feedbackReasonIds.length > 0) {
    for (const reason of await listRecords<{ id: string; isActive: boolean; isOther: boolean }>(
      client,
      'feedbackReasons',
      { id: { in: input.feedbackReasonIds } },
      { isActive: true, isOther: true },
    )) {
      feedbackReasons.set(reason.id, reason);
    }
  }

  const [failureReason] = input.failureReasonId
    ? await listRecords<{ isActive: boolean }>(
        client,
        'failureReasons',
        { id: { eq: input.failureReasonId } },
        { isActive: true },
      )
    : [];
  const error = validateCallForm({
    input,
    kind,
    deadline: deadlineAfterCall({
      status: followup?.status ?? null,
      deadlineAt: followup?.deadlineAt ?? null,
      isAnswered,
      now,
    }),
    feedbackReasons,
    failureReason,
  });

  if (error) {
    return fail(error);
  }

  const isFailing = Boolean(input.failureReasonId);
  const callId = await createRecord(client, 'Call', {
    personId,
    adminId: memberId,
    ownershipId: ownership.id,
    followupId: followup?.id ?? null,
    kind,
    startedAt: now.toISOString(),
    technicalStatus: input.technicalStatus,
    isAnswered,
    note: input.note,
    feedbackOtherText: input.feedbackOtherText,
    nextCallAt: isFailing ? null : input.nextCallAt,
    offScheduleReason: isFailing ? null : input.offScheduleReason,
    source: 'MANUAL',
  });

  for (const feedbackReasonId of input.feedbackReasonIds) {
    await createRecord(client, 'CallFeedbackReason', { callId, feedbackReasonId });
  }

  const firstAnswer = planFirstAnsweredCall({
    followupStatus: followup?.status ?? null,
    isAnswered,
    now,
  });

  if (firstAnswer && followup) {
    await updateRecord(client, 'Followup', followup.id, firstAnswer.followup);
    await updateRecord(client, 'Ownership', ownership.id, { state: firstAnswer.ownershipState });
  }

  if (isFailing && input.failureReasonId) {
    const plan = planMoveToFailed({ failureReasonId: input.failureReasonId, now });

    if (followup) {
      await updateRecord(client, 'Followup', followup.id, plan.followup);
    }

    await updateRecord(client, 'Ownership', ownership.id, plan.ownership);
    await updateRecord(client, 'Person', personId, plan.person);
    await recomputeVisibility({ client, personIds: [personId], now });
  }

  return { success: true, callId };
};

export const editCallNote = async ({
  client,
  memberId,
  callId,
  note,
  now = new Date(),
}: {
  client: RecordsClient;
  memberId: string;
  callId: string;
  note: string | null;
  now?: Date;
}): Promise<RecordCallResult> => {
  const [call] = await listRecords<{ adminId: string | null }>(
    client,
    'calls',
    { id: { eq: callId } },
    { adminId: true },
  );

  if (!call || call.adminId !== memberId) {
    return fail('Only the admin who made the call can edit its note');
  }

  await updateRecord(client, 'Call', callId, { note, noteEditedAt: now.toISOString() });

  return { success: true, callId };
};
