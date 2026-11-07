export const FREEZE_ADMIN_ROUTE_PATH = '/proopco/freeze-admin';
export const UNFREEZE_ADMIN_ROUTE_PATH = '/proopco/unfreeze-admin';
export const TRANSFER_USERS_ROUTE_PATH = '/proopco/transfer-users';
export const RELEASE_USERS_ROUTE_PATH = '/proopco/release-users';
export const DEACTIVATE_ADMIN_ROUTE_PATH = '/proopco/deactivate-admin';
export const ADMINS_ROUTE_PATH = '/proopco/admins';
export const FLAG_LONG_FREEZES_ROUTE_PATH = '/proopco/flag-long-freezes';

export const FLAG_LONG_FREEZES_CRON_PATTERN = '0 4 * * *';
export const LONG_FREEZE_DAYS = 7;

export const ADMIN_CRM_STATUSES = ['ACTIVE', 'FROZEN', 'DEACTIVATED'] as const;

export const AUDIT_ACTIONS = [
  'TRANSFER',
  'FREEZE',
  'UNFREEZE',
  'DEACTIVATE_ADMIN',
  'RELEASE_USER',
  'DEACTIVATE_OFFER',
  'SETTINGS_CHANGE',
  'NOTE_EDIT',
  'INCOME_PAID',
  'LONG_FREEZE_WARNING',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const REASON_REQUIRED_MESSAGE = 'A reason is required';
export const NOT_ALLOWED_MESSAGE = 'You are not allowed to do this';
