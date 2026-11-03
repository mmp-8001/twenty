import { MILLISECONDS_PER_DAY } from 'src/constants/proopco-jobs.constant';

export type CommissionTierRecord = {
  name: string;
  minDay: number;
  maxDay: number;
  rate: number;
};

export const countWholeDays = (from: string, to: string): number =>
  Math.floor(
    (new Date(to).getTime() - new Date(from).getTime()) / MILLISECONDS_PER_DAY,
  );

export const findCommissionTier = (
  tiers: CommissionTierRecord[],
  days: number,
): CommissionTierRecord | undefined =>
  tiers.find((tier) => tier.minDay <= days && days <= tier.maxDay);

// Integer micros, so no float ever becomes money.
export const computeCommissionMicros = (
  baseMicros: number,
  rate: number,
): number => Math.round(baseMicros * rate);

export const previousMonthOf = (referenceDate: Date): string => {
  const previous = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - 1, 1),
  );

  return previous.toISOString().slice(0, 7);
};

export const monthBounds = (month: string): { start: string; end: string } => {
  const [year, monthNumber] = month.split('-').map(Number);

  return {
    start: new Date(Date.UTC(year, monthNumber - 1, 1)).toISOString(),
    end: new Date(Date.UTC(year, monthNumber, 1)).toISOString(),
  };
};
