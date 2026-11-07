import {
  CALL_OFF_SCHEDULE_REASONS,
  CALL_TECHNICAL_STATUSES,
  FOLLOWUP_DAYS,
  PENDING_FIRST_CALL_DAYS,
} from 'src/constants/ownership.constant';

const DAY_MS = 24 * 60 * 60 * 1000;

// shortcut: fixed 24 h days, which equal Tehran calendar days only while Tehran has no DST; revisit if that changes.
export const addDays = (from: Date, days: number): Date =>
  new Date(from.getTime() + days * DAY_MS);

export const pendingFirstCallDeadline = (addedAt: Date): Date =>
  addDays(addedAt, PENDING_FIRST_CALL_DAYS);

export type CallFormVariant = 'unanswered' | 'ANSWERED' | 'FAILED';

export type CallFormInput = {
  technicalStatus: string;
  note?: string | null;
  feedbackReasonIds: string[];
  feedbackOtherText?: string | null;
  nextCallAt?: string | null;
  offScheduleReason?: string | null;
  failureReasonId?: string | null;
};

export type ReasonSummary = { isActive: boolean; isOther?: boolean };

export const selectFormVariant = (
  input: Pick<CallFormInput, 'technicalStatus' | 'failureReasonId'>,
): CallFormVariant => {
  if (input.failureReasonId) {
    return 'FAILED';
  }

  return input.technicalStatus === 'ANSWERED' ? 'ANSWERED' : 'unanswered';
};

export const isAnsweredStatus = (technicalStatus: string): boolean =>
  technicalStatus === 'ANSWERED';

// The deadline the next-call time is checked against: an answered first call moves it to 30 days from that call.
export const deadlineAfterCall = ({
  status,
  deadlineAt,
  isAnswered,
  now,
}: {
  status: string | null;
  deadlineAt: string | null;
  isAnswered: boolean;
  now: Date;
}): Date | null => {
  if (isAnswered && status === 'PENDING_FIRST_CALL') {
    return addDays(now, FOLLOWUP_DAYS);
  }

  return deadlineAt ? new Date(deadlineAt) : null;
};

// Returns the first reason the form is invalid, or null. LOGIC section 8.
export const validateCallForm = ({
  input,
  kind,
  deadline,
  feedbackReasons,
  failureReason,
}: {
  input: CallFormInput;
  kind: 'FOLLOWUP' | 'RETENTION';
  deadline: Date | null;
  feedbackReasons: Map<string, ReasonSummary>;
  failureReason?: ReasonSummary;
}): string | null => {
  if (!(CALL_TECHNICAL_STATUSES as readonly string[]).includes(input.technicalStatus)) {
    return 'Choose how the call went';
  }

  const variant = selectFormVariant(input);

  if (variant === 'FAILED' && !failureReason?.isActive) {
    return 'Choose an active failure reason';
  }

  const isAnswered = isAnsweredStatus(input.technicalStatus);

  if (!isAnswered && input.feedbackReasonIds.length > 0) {
    return 'Feedback reasons belong to answered calls';
  }

  if (isAnswered) {
    if (input.feedbackReasonIds.length === 0) {
      return 'Choose at least one feedback reason';
    }

    const chosen = input.feedbackReasonIds.map((id) => feedbackReasons.get(id));

    if (chosen.some((reason) => !reason?.isActive)) {
      return 'Choose active feedback reasons';
    }

    if (chosen.some((reason) => reason?.isOther) && !input.feedbackOtherText?.trim()) {
      return 'Describe the other reason';
    }
  }

  if (variant === 'FAILED') {
    return null;
  }

  if (!input.nextCallAt) {
    return kind === 'RETENTION' && isAnswered ? null : 'Choose the next call time';
  }

  const nextCallAt = new Date(input.nextCallAt);

  if (Number.isNaN(nextCallAt.getTime())) {
    return 'Choose a valid next call time';
  }

  if (deadline && nextCallAt.getTime() > deadline.getTime()) {
    return 'The next call time cannot be after the deadline';
  }

  if (
    input.offScheduleReason &&
    !(CALL_OFF_SCHEDULE_REASONS as readonly string[]).includes(input.offScheduleReason)
  ) {
    return 'Choose a valid off-schedule reason';
  }

  return null;
};

// What an answered first call changes on the case and its Ownership.
export const planFirstAnsweredCall = ({
  followupStatus,
  isAnswered,
  now,
}: {
  followupStatus: string | null;
  isAnswered: boolean;
  now: Date;
}) =>
  isAnswered && followupStatus === 'PENDING_FIRST_CALL'
    ? {
        followup: {
          status: 'IN_PROGRESS',
          firstAnsweredCallAt: now.toISOString(),
          deadlineAt: addDays(now, FOLLOWUP_DAYS).toISOString(),
        },
        ownershipState: 'IN_FOLLOWUP',
      }
    : null;

// FUP-07: permanent failure. The Followup and Ownership close; the User never returns to a list.
export const planMoveToFailed = ({
  failureReasonId,
  now,
}: {
  failureReasonId: string;
  now: Date;
}) => {
  const at = now.toISOString();

  return {
    followup: {
      status: 'FAILED',
      failureReasonId,
      closedAt: at,
      openKey: null,
    },
    ownership: { endedAt: at, endReason: 'FAILED', openUserKey: null },
    person: { permanentlyFailedAt: at, currentOwnerId: null },
  };
};
