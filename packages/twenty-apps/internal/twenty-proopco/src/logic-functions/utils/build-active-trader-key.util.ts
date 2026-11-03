import {
  ACTIVE_FOLLOWUP_STAGES,
  type FollowupStage,
} from 'src/constants/followup.constant';

export const buildActiveTraderKey = ({
  stage,
  traderId,
}: {
  stage: FollowupStage;
  traderId: string | null;
}): string | null =>
  ACTIVE_FOLLOWUP_STAGES.includes(stage) ? traderId : null;
