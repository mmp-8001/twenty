export const PROOPCO_SYNC_ROUTE_PATH = '/proopco/sync';
export const PROOPCO_SYNC_TOKEN_HEADER = 'x-proopco-sync-token';
export const PROOPCO_SYNC_MAX_BATCH_SIZE = 200;
export const PROOPCO_SYNC_TIMEOUT_SECONDS = 120;

export const PAYMENT_KINDS = [
  'purchase',
  'installment_initial',
  'installment_remaining',
] as const;
