export const ENQUEUE_ROUTE_PATH = '/sms/enqueue';
export const SEND_ROUTE_PATH = '/sms/send';
export const DELIVERY_ROUTE_PATH = '/sms/delivery';

export const ENQUEUE_TOKEN_HEADER = 'x-sms-enqueue-token';
export const CALLBACK_TOKEN_HEADER = 'x-sms-callback-token';

export const SEND_CRON_PATTERN = '* * * * *';
export const MAX_ENQUEUE_BATCH_SIZE = 200;

// Wire values are lowercase (spec); stored select values are UPPER_SNAKE_CASE.
export const SMS_STATUSES = [
  'queued',
  'sent',
  'delivered',
  'failed',
  'skipped_opt_out',
  'invalid',
] as const;
