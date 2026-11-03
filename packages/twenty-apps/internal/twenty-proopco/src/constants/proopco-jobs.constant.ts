export const TRACK_ROUTE_PATH = '/proopco/track';
export const SWEEP_ROUTE_PATH = '/proopco/sweep';
export const COMMISSION_ROUTE_PATH = '/proopco/commission';
export const MONTHLY_INCOME_ROUTE_PATH = '/proopco/monthly-income';

export const SWEEP_CRON_PATTERN = '0 * * * *';

export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_FOLLOWUP_TYPES = [
  { name: 'Sales', expiryDays: 14, commissionable: true },
  { name: 'Support', expiryDays: 7, commissionable: false },
];

// Seeded because the spec lists no defaults; managers edit them as records.
export const DEFAULT_COMMISSION_TIERS = [
  { name: 'Days 0-7', minDay: 0, maxDay: 7, rate: 0.1 },
  { name: 'Days 8-14', minDay: 8, maxDay: 14, rate: 0.07 },
  { name: 'Days 15-30', minDay: 15, maxDay: 30, rate: 0.05 },
];
