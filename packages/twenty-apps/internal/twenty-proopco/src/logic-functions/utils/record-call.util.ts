import { isString } from '@sniptt/guards';

import { INACTIVE_ADMIN_MESSAGE, isActiveMember } from 'src/logic-functions/utils/is-active-member.util';
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
import { writeAuditLog } from 'src/logic-functions/utils/write-audit-log.util';
import { recomputeVisibility } from 'src/logic-functions/utils/recompute-visibility.util';
import {
  buildTouchWindows,
  isOutsideSuggestedWindow,
  planTouchChanges,
  suggestTouchNo,
  type TouchState,
} from 'src/utils/call-windows.util';

export type RecordCallResult =
  | { success: true; callId: string }
  | { success: false; error: string };

type FollowupNode = {
  id: string;
  status: string | null;
  deadlineAt: string | null;
};

type TouchNode = {
  id: string;
  touchNo: number;
  windowStartAt: string;
  windowEndAt: string;
  status: string;
};

const toTouchState = ({ touchNo, windowStartAt, windowEndAt, status }: TouchNode): TouchState => ({
  touchNo,
  windowStartAt: new Date(windowStartAt),
  windowEndAt: new Date(windowEndAt),
  status,
});

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
  if (!(await isActiveMember(client, memberId))) {
    return fail(INACTIVE_ADMIN_MESSAGE);
  }

  const [person] = await listRecords<{ currentOwnerId: string | null }>(
    client,
    'people',
    { id: { eq: personId } },
    { currentOwnerId: true },
  );

  // Only the owner calls, and the message does not say who owns the User otherwise.
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
  const touches =
    followup?.status === 'IN_PROGRESS'
      ? await listRecords<TouchNode>(client, 'touches', { followupId: { eq: followup.id } }, {
          touchNo: true,
          windowStartAt: true,
          windowEndAt: true,
          status: true,
        })
      : [];

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
  const firstAnswer = planFirstAnsweredCall({
    followupStatus: followup?.status ?? null,
    isAnswered,
    now,
  });
  // The first answered call creates the windows, so its own suggestion comes from windows not yet stored.
  const windows: TouchState[] = firstAnswer
    ? buildTouchWindows(now).map((window) => ({
        ...window,
        status: window.touchNo === 1 ? 'DONE' : 'OPEN',
      }))
    : touches.map(toTouchState);
  const suggestedTouchNo = windows.length > 0 ? suggestTouchNo({ windows, now, isAnswered }) : null;
  const nextCallAt = input.nextCallAt ? new Date(input.nextCallAt) : null;
  const isOffSchedule =
    !isFailing &&
    nextCallAt !== null &&
    isOutsideSuggestedWindow({ windows, suggestedTouchNo, nextCallAt });

  // Server side as well as in the form.
  if (isOffSchedule && !input.offScheduleReason) {
    return fail('Choose why the next call is outside the suggested window');
  }

  const callId = await createRecord(client, 'Call', {
    personId,
    adminId: memberId,
    visibleToMemberIds: [memberId],
    ownershipId: ownership.id,
    followupId: followup?.id ?? null,
    kind,
    startedAt: now.toISOString(),
    technicalStatus: input.technicalStatus,
    isAnswered,
    note: input.note,
    feedbackOtherText: input.feedbackOtherText,
    nextCallAt: isFailing ? null : input.nextCallAt,
    offScheduleReason: isOffSchedule ? input.offScheduleReason : null,
    source: 'MANUAL',
  });

  for (const feedbackReasonId of input.feedbackReasonIds) {
    await createRecord(client, 'CallFeedbackReason', { callId, feedbackReasonId });
  }

  if (firstAnswer && followup) {
    await updateRecord(client, 'Followup', followup.id, firstAnswer.followup);
    await updateRecord(client, 'Ownership', ownership.id, { state: firstAnswer.ownershipState });
  }

  if (followup && !isFailing) {
    const changes = planTouchChanges({
      touches: windows,
      now,
      isAnswered,
      suggestedTouchNo,
      offScheduleReason: isOffSchedule ? (input.offScheduleReason ?? null) : null,
      nextCallAt,
    });
    const statusByTouchNo = new Map(changes.map(({ touchNo, status }) => [touchNo, status]));

    if (firstAnswer) {
      for (const { touchNo, windowStartAt, windowEndAt, status: initialStatus } of windows) {
        const status = statusByTouchNo.get(touchNo) ?? initialStatus;

        await createRecord(client, 'Touch', {
          followupId: followup.id,
          adminId: memberId,
          touchNo,
          windowStartAt: windowStartAt.toISOString(),
          windowEndAt: windowEndAt.toISOString(),
          status,
          completedCallId: status === 'DONE' ? callId : null,
        });
      }
    } else {
      for (const { id, touchNo } of touches) {
        const status = statusByTouchNo.get(touchNo);

        if (status) {
          await updateRecord(client, 'Touch', id, {
            status,
            ...(status === 'DONE' ? { completedCallId: callId } : {}),
          });
        }
      }
    }
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
  const [call] = await listRecords<{ adminId: string | null; note: string | null }>(
    client,
    'calls',
    { id: { eq: callId } },
    { adminId: true, note: true },
  );

  if (!call || call.adminId !== memberId) {
    return fail('Only the admin who made the call can edit its note');
  }

  await updateRecord(client, 'Call', callId, { note, noteEditedAt: now.toISOString() });
  await writeAuditLog({
    client,
    actorId: memberId,
    action: 'NOTE_EDIT',
    subjectType: 'call',
    subjectId: callId,
    payload: { previousNote: call.note },
  });

  return { success: true, callId };
};
