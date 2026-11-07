// ADR 0002: the rate is fixed; each Commission stores it.
export const COMMISSION_RATE_PERCENT = 2;

const MICROS = 1_000_000;

// Integer micro arithmetic keeps 500 + 300 + 200 USDT at exactly 20.
export const computeCommissionUsdt = (amountUsdt: number): number =>
  Math.round(Math.round(amountUsdt * MICROS) * (COMMISSION_RATE_PERCENT / 100)) / MICROS;
