import { isNull, isString } from '@sniptt/guards';

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
  activeTraderKey?: null;
  ownerId?: null;
  retryExpiresAt?: string;
  failureReason?: string;
};

const hasPassed = (value: string | null, referenceDate: Date): boolean =>
  isString(value) && new Date(value).getTime() <= referenceDate.getTime();

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
    return { stage: 'EXPIRED', activeTraderKey: null };
  }

  if (
    followup.stage !== 'RETRY_PENDING' ||
    !hasPassed(followup.retryExpiresAt, referenceDate)
  ) {
    return null;
  }

  if (isNull(followup.ownerId)) {
    return {
      stage: 'EXPIRED',
      activeTraderKey: null,
      failureReason: NOT_FOLLOWED_UP_REASON,
    };
  }

  return {
    ownerId: null,
    retryExpiresAt: new Date(
      referenceDate.getTime() + poolDays * MILLISECONDS_PER_DAY,
    ).toISOString(),
  };
};
