import { REPORT_PERIODS, type ReportPeriod } from 'src/constants/income-report.constant';

export const readReportPeriod = (value: unknown): ReportPeriod =>
  REPORT_PERIODS.find((period) => period === value) ?? 'MONTHLY';
