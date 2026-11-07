export const OWNERSHIP_STATES = [
  'PENDING_FIRST_CALL',
  'IN_FOLLOWUP',
  'SUCCESSFUL',
  'REBUY_PENDING',
] as const;

// rolled_back marks an Ownership that Add to follow-up opened and then abandoned after a later step failed.
export const OWNERSHIP_END_REASONS = [
  'NO_ANSWER_7D',
  'PURCHASE_BEFORE_CALL',
  'EXPIRED',
  'FAILED',
  'RELEASED_72H',
  'TRANSFERRED',
  'RELEASED_BY_MANAGER',
  'ROLLED_BACK',
] as const;

export const FOLLOWUP_KINDS = ['CAMPAIGN', 'REBUY'] as const;

export const FOLLOWUP_STATUSES = [
  'PENDING_FIRST_CALL',
  'IN_PROGRESS',
  'REBUY_PENDING',
  'SUCCESSFUL',
  'EXPIRED',
  'FAILED',
  'NO_ANSWER_FIRST_CALL',
  'PURCHASE_BEFORE_CALL',
  'RELEASED_72H',
  'TRANSFERRED',
] as const;

export const CALL_KINDS = ['FOLLOWUP', 'RETENTION'] as const;

export const CALL_TECHNICAL_STATUSES = [
  'ANSWERED',
  'NO_ANSWER',
  'BUSY',
  'SWITCHED_OFF',
  'REJECTED',
  'INVALID_NUMBER',
] as const;

export const CALL_OFF_SCHEDULE_REASONS = ['USER_REQUEST', 'ADMIN_DECISION'] as const;

export const PENDING_FIRST_CALL_DAYS = 7;
export const FOLLOWUP_DAYS = 30;

export const OWN_07_MESSAGE = "This user is in another admin's follow-up list";
export const USER_NOT_AVAILABLE_MESSAGE = 'This user is not available';

export const ADD_TO_FOLLOWUP_ROUTE_PATH = '/proopco/add-to-followup';
export const RECORD_CALL_ROUTE_PATH = '/proopco/record-call';
export const EDIT_CALL_NOTE_ROUTE_PATH = '/proopco/edit-call-note';

export const TOUCH_STATUSES = ['OPEN', 'DONE', 'MISSED', 'DEFERRED_BY_USER'] as const;

export const MY_FOLLOWUPS_ROUTE_PATH = '/proopco/my-followups';

export const COMMISSION_KINDS = ['CAMPAIGN_SUCCESS', 'REBUY_SUCCESS', 'RETENTION'] as const;

// DECISION: proopco must send the account status "active" (and "breached"); compared case-insensitively.
export const ACTIVE_ACCOUNT_STATUS = 'active';

export const ADD_REBUY_ROUTE_PATH = '/proopco/add-rebuy';
export const REBUY_NOT_AVAILABLE_MESSAGE = 'This rebuy user is no longer available';
