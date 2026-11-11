import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_STARTS_AT_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ENDS_AT_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_COOLDOWN_DAYS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'campaign',
  namePlural: 'campaigns',
  labelSingular: 'Campaign',
  labelPlural: 'Campaigns',
  description: 'A Tehran-dated sales campaign over segments and agents',
  icon: 'IconTargetArrow',
  labelIdentifierFieldMetadataUniversalIdentifier:
    CAMPAIGN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: CAMPAIGN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
      defaultValue: "''",
    },
    {
      universalIdentifier: CAMPAIGN_STARTS_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'startsAt',
      label: 'Starts at',
      icon: 'IconCalendarPlus',
    },
    {
      universalIdentifier: CAMPAIGN_ENDS_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'endsAt',
      label: 'Ends at',
      icon: 'IconCalendarOff',
      isNullable: true,
    },
    {
      universalIdentifier: CAMPAIGN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconPlayerPlay',
      defaultValue: "'SCHEDULED'",
      options: [
        {
          id: 'd6ddf605-462a-4568-a290-de6f01c63448',
          value: 'SCHEDULED',
          label: 'Scheduled',
          position: 0,
          color: 'blue',
        },
        {
          id: '08473489-8b8d-4fcf-82e3-5b24035670d0',
          value: 'ACTIVE',
          label: 'Active',
          position: 1,
          color: 'green',
        },
        {
          id: 'b601e206-7a35-4d4d-b502-fa9ca8c05f55',
          value: 'ENDED',
          label: 'Ended',
          position: 2,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: CAMPAIGN_COOLDOWN_DAYS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'cooldownDays',
      label: 'Cool-down (days)',
      icon: 'IconSnowflake',
      defaultValue: 0,
    },
  ],
});
