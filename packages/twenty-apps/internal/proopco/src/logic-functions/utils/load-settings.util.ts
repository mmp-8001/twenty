import { SETTINGS_DEFAULTS } from 'src/logic-functions/utils/ensure-settings.util';
import {
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

type Settings = Omit<typeof SETTINGS_DEFAULTS, 'name' | 'smsTemplate'>;

export const loadSettings = async (client: RecordsClient): Promise<Settings> => {
  const [row] = await listRecords<Partial<Settings>>(
    client,
    'proopcoSettingsRecords',
    {},
    {
      rebuyWindowHours: true,
      rebuyFollowUpDays: true,
      rebuyCooldownDays: true,
      lateEventGraceMinutes: true,
    },
    1,
  );

  return {
    rebuyWindowHours: row?.rebuyWindowHours ?? SETTINGS_DEFAULTS.rebuyWindowHours,
    rebuyFollowUpDays: row?.rebuyFollowUpDays ?? SETTINGS_DEFAULTS.rebuyFollowUpDays,
    rebuyCooldownDays: row?.rebuyCooldownDays ?? SETTINGS_DEFAULTS.rebuyCooldownDays,
    lateEventGraceMinutes:
      row?.lateEventGraceMinutes ?? SETTINGS_DEFAULTS.lateEventGraceMinutes,
  };
};

// A frozen agent's deals and contacts are skipped by the sweeper entirely.
export const loadFrozenAgentIds = async (client: RecordsClient): Promise<string[]> =>
  (
    await listRecords<{ id: string }>(
      client,
      'agents',
      { frozenSince: { is: 'NOT_NULL' } },
      {},
    )
  ).map(({ id }) => id);

export const notOwnedBy = (field: string, frozenAgentIds: string[]) =>
  frozenAgentIds.length === 0 ? [] : [{ not: { [field]: { in: frozenAgentIds } } }];
