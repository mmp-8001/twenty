const COMMISSION_PERCENT = 2;

// Integer cents so a half-cent rounds up exactly: 5.005 -> 5.01.
export const commissionOf = (amountUsdt: number): number =>
  Math.round((Math.round(amountUsdt * 100) * COMMISSION_PERCENT) / 100) / 100;
