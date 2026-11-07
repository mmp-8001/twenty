export const INCOME_STATUSES = ['PENDING', 'PAID'] as const;

export const CREATE_MONTHLY_INCOMES_ROUTE_PATH = '/proopco/create-monthly-incomes';
export const MARK_INCOME_PAID_ROUTE_PATH = '/proopco/mark-income-paid';
export const MY_REPORT_ROUTE_PATH = '/proopco/my-report';
export const TEAM_REPORT_ROUTE_PATH = '/proopco/team-report';

// Tehran midnight is 20:30 UTC and a Jalali month start cannot be written as a cron, so the job ticks
// often and only does work on a first Jalali day; the rollup is idempotent.
export const CREATE_MONTHLY_INCOMES_CRON_PATTERN = '*/5 * * * *';

export const REPORT_PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY', 'ALL'] as const;

export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const INCOME_NOT_AVAILABLE_MESSAGE = 'This income is not available';
