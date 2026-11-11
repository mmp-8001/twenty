import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  SETTINGS_OBJECT_UNIVERSAL_IDENTIFIER,
  SETTINGS_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  SETTINGS_REBUY_WINDOW_HOURS_FIELD_UNIVERSAL_IDENTIFIER,
  SETTINGS_REBUY_FOLLOW_UP_DAYS_FIELD_UNIVERSAL_IDENTIFIER,
  SETTINGS_REBUY_COOLDOWN_DAYS_FIELD_UNIVERSAL_IDENTIFIER,
  SETTINGS_LATE_EVENT_GRACE_MINUTES_FIELD_UNIVERSAL_IDENTIFIER,
  SETTINGS_SMS_TEMPLATE_FIELD_UNIVERSAL_IDENTIFIER,
  SETTINGS_LAST_ROLLED_UP_JALALI_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: SETTINGS_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'proopcoSettings',
  namePlural: 'proopcoSettingsRecords',
  labelSingular: 'Proopco settings',
  labelPlural: 'Proopco settings',
  description: 'The single settings record of the Proopco app',
  icon: 'IconSettings',
  labelIdentifierFieldMetadataUniversalIdentifier:
    SETTINGS_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: SETTINGS_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
      defaultValue: "'Settings'",
    },
    {
      universalIdentifier: SETTINGS_REBUY_WINDOW_HOURS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'rebuyWindowHours',
      label: 'Rebuy window (hours)',
      icon: 'IconClockHour3',
      isNullable: true,
    },
    {
      universalIdentifier: SETTINGS_REBUY_FOLLOW_UP_DAYS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'rebuyFollowUpDays',
      label: 'Rebuy follow-up (days)',
      icon: 'IconCalendar',
      isNullable: true,
    },
    {
      universalIdentifier: SETTINGS_REBUY_COOLDOWN_DAYS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'rebuyCooldownDays',
      label: 'Rebuy cool-down (days)',
      icon: 'IconSnowflake',
      isNullable: true,
    },
    {
      universalIdentifier: SETTINGS_LATE_EVENT_GRACE_MINUTES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'lateEventGraceMinutes',
      label: 'Late event grace (minutes)',
      icon: 'IconHourglass',
      isNullable: true,
    },
    {
      universalIdentifier: SETTINGS_SMS_TEMPLATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'smsTemplate',
      label: 'SMS template',
      icon: 'IconMessage',
      isNullable: true,
    },
    {
      universalIdentifier: SETTINGS_LAST_ROLLED_UP_JALALI_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'lastRolledUpJalaliMonth',
      label: 'Last rolled-up Jalali month',
      icon: 'IconCalendarStats',
      isNullable: true,
    },
  ],
});
