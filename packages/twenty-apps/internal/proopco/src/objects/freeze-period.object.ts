import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  FREEZE_PERIOD_DAYS_FROZEN_FIELD_UNIVERSAL_IDENTIFIER,
  FREEZE_PERIOD_ENDED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  FREEZE_PERIOD_LONG_FREEZE_FIELD_UNIVERSAL_IDENTIFIER,
  FREEZE_PERIOD_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  FREEZE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
  FREEZE_PERIOD_STARTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  FREEZE_PERIOD_WAITING_CONTACTS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: FREEZE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'freezePeriod',
  namePlural: 'freezePeriods',
  labelSingular: 'Freeze period',
  labelPlural: 'Freeze periods',
  description: 'A span during which an agent was frozen',
  icon: 'IconSnowflake',
  labelIdentifierFieldMetadataUniversalIdentifier:
    FREEZE_PERIOD_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: FREEZE_PERIOD_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
      defaultValue: "''",
    },
    {
      universalIdentifier: FREEZE_PERIOD_STARTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'startedAt',
      label: 'Started at',
      icon: 'IconClock',
      isNullable: true,
    },
    {
      universalIdentifier: FREEZE_PERIOD_ENDED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'endedAt',
      label: 'Ended at',
      icon: 'IconClock',
      isNullable: true,
    },
    {
      universalIdentifier: FREEZE_PERIOD_DAYS_FROZEN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'daysFrozen',
      label: 'Days frozen',
      icon: 'IconCalendar',
      defaultValue: 0,
    },
    {
      universalIdentifier: FREEZE_PERIOD_WAITING_CONTACTS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'waitingContacts',
      label: 'Waiting contacts',
      icon: 'IconUsers',
      defaultValue: 0,
    },
    {
      universalIdentifier: FREEZE_PERIOD_LONG_FREEZE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.BOOLEAN,
      name: 'longFreeze',
      label: 'Long freeze',
      icon: 'IconAlertTriangle',
      defaultValue: false,
    },
  ],
});
