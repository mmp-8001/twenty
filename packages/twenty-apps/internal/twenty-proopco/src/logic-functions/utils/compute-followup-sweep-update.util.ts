import { MILLISECONDS_PER_DAY } from 'src/constants/proopco-jobs.constant';
import {
  NOT_FOLLOWED_UP_REASON,
  type FollowupStage,
} from 'src/constants/followup.constant';

export type SweepFollowup = {
  stage: FollowupStage;
  ownerId: string | null;
  expiresAt: string | null;
  retryExpiresAt: string | null;
};

export type FollowupSweepUpdate = {
  stage?: FollowupStage;
  ownerId?: null;
  retryExpiresAt?: string;
  failureReason?: string;
};

const hasPassed = (value: string | null, referenceDate: Date): boolean =>
  value !== null && new Date(value).getTime() <= referenceDate.getTime();

export const computeFollowupSweepUpdate = ({
  followup,
  referenceDate,
  poolDays,
}: {
  followup: SweepFollowup;
  referenceDate: Date;
  poolDays: number;
}): FollowupSweepUpdate | null => {
  if (
    followup.stage === 'PENDING' &&
    hasPassed(followup.expiresAt, referenceDate)
  ) {
    return { stage: 'EXPIRED' };
  }

  if (
    followup.stage !== 'RETRY_PENDING' ||
    !hasPassed(followup.retryExpiresAt, referenceDate)
  ) {
    return null;
  }

  if (followup.ownerId === null) {
    return { stage: 'EXPIRED', failureReason: NOT_FOLLOWED_UP_REASON };
  }

  return {
    ownerId: null,
    retryExpiresAt: new Date(
      referenceDate.getTime() + poolDays * MILLISECONDS_PER_DAY,
    ).toISOString(),
  };
};
