export const OFFER_CAPABILITIES = ['DISCOUNT', 'RESET', 'INSTALLMENT'] as const;
export const OFFER_STATUSES = ['ACTIVE', 'DEACTIVATED'] as const;
export const OFFER_SET_TYPES = ['REBUY', 'RETENTION'] as const;
// ACTIVATING is the claim a retry takes, so two concurrent retries never both call the code service.
export const OFFER_ACTIVATION_STATUSES = [
  'ACTIVATING',
  'ACTIVATION_FAILED',
  'ACTIVE',
  'USED',
  'EXPIRED',
  'DEACTIVATED',
] as const;
export const OFFER_SMS_STATUSES = ['PENDING', 'SENT', 'FAILED'] as const;

export const OFFER_OPTIONS_ROUTE_PATH = '/proopco/offer-options';
export const ACTIVATE_OFFER_ROUTE_PATH = '/proopco/activate-offer';
export const RESEND_OFFER_SMS_ROUTE_PATH = '/proopco/resend-offer-sms';
export const DEACTIVATE_OFFER_ROUTE_PATH = '/proopco/deactivate-offer';

export const SMS_ENQUEUE_TOKEN_HEADER = 'x-sms-enqueue-token';

export const OFFER_NOT_AVAILABLE_MESSAGE = 'This offer is not available';
export const OFFER_ALREADY_ACTIVE_MESSAGE = 'This offer is already activated for this user';
export const ANSWERED_CALL_REQUIRED_MESSAGE = 'Offers can only be activated after an answered call';
