export const SIGNATURE_MAX_SKEW_MS = 5 * 60 * 1000;
export const TIMESTAMP_HEADER = 'x-proopco-timestamp';
export const SIGNATURE_HEADER = 'x-proopco-signature';
export const SUPPORTED_SCHEMA_MAJOR = 1;
export const MAX_EVENTS_PER_REQUEST = 500;
export const MAX_ATTEMPTS = 5;
export const SWEEPER_BATCH_SIZE = 200;
// Events processed inside the request, so contacts show up without waiting for the sweeper.
export const INLINE_PROCESS_LIMIT = 25;

export type PlatformEventType =
  | 'contact.upserted'
  | 'purchase.settled'
  | 'account.last_lost';

export const PLATFORM_EVENT_TYPES: PlatformEventType[] = [
  'contact.upserted',
  'purchase.settled',
  'account.last_lost',
];
