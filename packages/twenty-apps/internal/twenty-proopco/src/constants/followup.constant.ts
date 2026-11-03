export const FOLLOWUP_STAGES = [
  'PENDING',
  'RETRY_PENDING',
  'SUCCEEDED',
  'FAILED',
  'EXPIRED',
] as const;

export type FollowupStage = (typeof FOLLOWUP_STAGES)[number];

export const ACTIVE_FOLLOWUP_STAGES: FollowupStage[] = [
  'PENDING',
  'RETRY_PENDING',
];

export const NOT_FOLLOWED_UP_REASON = 'NOT_FOLLOWED_UP';

export const FOLLOWUP_STAGE_OPTIONS = [
  { id: 'd1a0b6e2-5c3f-4b8a-9e71-2f4c6a8d0b01', value: 'PENDING', label: 'Pending', position: 0, color: 'blue' },
  { id: 'e2b1c7f3-6d4a-4c9b-8f82-3a5d7b9e1c02', value: 'RETRY_PENDING', label: 'Retry Pending', position: 1, color: 'orange' },
  { id: 'f3c2d8a4-7e5b-4dac-9a93-4b6e8caf2d03', value: 'SUCCEEDED', label: 'Succeeded', position: 2, color: 'green' },
  { id: 'a4d3e9b5-8f6c-4ebd-8ba4-5c7f9dba3e04', value: 'FAILED', label: 'Failed', position: 3, color: 'red' },
  { id: 'b5e4fac6-9a7d-4fce-9cb5-6d8aaecb4f05', value: 'EXPIRED', label: 'Expired', position: 4, color: 'gray' },
] as const;

export const FOLLOWUP_FAILURE_REASON_OPTIONS = [
  { id: 'c6f5abd7-ab8e-40df-8dc6-7e9bbfdc5a06', value: 'NOT_INTERESTED', label: 'Not interested', position: 0, color: 'red' },
  { id: 'd7a6bce8-bc9f-41e0-9ed7-8fa0c0ed6b07', value: 'UNREACHABLE', label: 'Unreachable', position: 1, color: 'orange' },
  { id: 'e8b7cdf9-cda0-42f1-8fe8-90b1d1fe7c08', value: 'NOT_FOLLOWED_UP', label: 'Not followed up', position: 2, color: 'gray' },
  { id: 'f9c8dea0-deb1-4302-90f9-a1c2e20f8d09', value: 'OTHER', label: 'Other', position: 3, color: 'sky' },
] as const;
