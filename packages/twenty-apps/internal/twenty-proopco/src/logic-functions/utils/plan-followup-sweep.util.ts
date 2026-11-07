const DAY_MS = 24 * 60 * 60 * 1000;

type OpenCaseStatus = 'PENDING_FIRST_CALL' | 'IN_PROGRESS';

// FUP-03 and FUP-05: what a case past its deadline turns into. Null when it is not due.
export const planFollowupSweep = ({
  status,
  deadlineAt,
  cooldownDays,
  now,
}: {
  status: string | null;
  deadlineAt: string | null;
  cooldownDays: number;
  now: Date;
}) => {
  if (!deadlineAt || new Date(deadlineAt) > now) {
    return null;
  }

  const at = now.toISOString();
  const ended = (endReason: string) => ({ endedAt: at, endReason, openUserKey: null });
  const closed = (closedStatus: string) => ({ status: closedStatus, closedAt: at, openKey: null });

  switch (status as OpenCaseStatus | null) {
    case 'PENDING_FIRST_CALL':
      return {
        fromStatus: 'PENDING_FIRST_CALL',
        followup: closed('NO_ANSWER_FIRST_CALL'),
        ownership: ended('NO_ANSWER_7D'),
        person: { currentOwnerId: null },
      };
    case 'IN_PROGRESS':
      return {
        fromStatus: 'IN_PROGRESS',
        followup: closed('EXPIRED'),
        ownership: ended('EXPIRED'),
        person: {
          currentOwnerId: null,
          cooldownUntil:
            cooldownDays > 0 ? new Date(now.getTime() + cooldownDays * DAY_MS).toISOString() : null,
        },
      };
    default:
      return null;
  }
};
