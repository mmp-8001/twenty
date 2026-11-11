import { DAY_MS } from 'src/constants/time.constant';
import {
  startOfTehranDate,
  tehranDateOf,
} from 'src/utils/tehran-day.util';

export type CampaignStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED';

type CampaignDates = { startsAt: string; endsAt: string | null };

// Ended wins over Scheduled so that End now works on a campaign that never started.
export const computeCampaignStatus = (
  { startsAt, endsAt }: CampaignDates,
  now: Date,
): CampaignStatus => {
  if (
    endsAt !== null &&
    now.getTime() >= startOfTehranDate(endsAt).getTime() + DAY_MS
  ) {
    return 'ENDED';
  }

  return now.getTime() < startOfTehranDate(startsAt).getTime()
    ? 'SCHEDULED'
    : 'ACTIVE';
};

export const yesterdayInTehran = (now: Date): string =>
  tehranDateOf(new Date(now.getTime() - DAY_MS));
