import {
  createRecord,
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

export const SETTINGS_DEFAULTS = {
  name: 'Settings',
  rebuyWindowHours: 72,
  rebuyFollowUpDays: 30,
  rebuyCooldownDays: 30,
  lateEventGraceMinutes: 60,
  smsTemplate:
    'Your code {code} ({capability}) is valid until {expiry} (Tehran time).',
};

export const ensureSettings = async (client: RecordsClient): Promise<void> => {
  const existing = await listRecords(client, 'proopcoSettingsRecords', {}, {}, 1);

  if (existing.length === 0) {
    await createRecord(client, 'ProopcoSettings', SETTINGS_DEFAULTS);
  }
};
