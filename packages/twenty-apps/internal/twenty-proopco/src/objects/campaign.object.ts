import { defineObject, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CAMPAIGN_ADMIN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ADMINS_ON_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_AVAILABLE_USER_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_COOLDOWN_DAYS_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ENDS_AT_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ON_CAMPAIGN_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_SEGMENT_VIEW_ID_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_STARTS_AT_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'campaign',
  namePlural: 'campaigns',
  labelSingular: 'Campaign',
  labelPlural: 'Campaigns',
  description: 'A Segment given to Admins to work, with a cooldown and a time window.',
  icon: 'IconSpeakerphone',
  disabledObjectPermissionActions: [
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  labelIdentifierFieldMetadataUniversalIdentifier:
    CAMPAIGN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: CAMPAIGN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconTag',
    },
    {
      universalIdentifier: CAMPAIGN_SEGMENT_VIEW_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'segmentViewId',
      label: 'Segment view id',
      description: 'Id of the saved View on People whose filters pick the Users.',
      icon: 'IconFilter',
    },
    {
      universalIdentifier: CAMPAIGN_COOLDOWN_DAYS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'cooldownDays',
      label: 'Cooldown days',
      description: 'Days an expired User stays out of the User lists.',
      icon: 'IconClockPause',
      defaultValue: 0,
    },
    {
      universalIdentifier: CAMPAIGN_STARTS_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'startsAt',
      label: 'Starts at',
      icon: 'IconCalendarPlus',
    },
    {
      universalIdentifier: CAMPAIGN_ENDS_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'endsAt',
      label: 'Ends at',
      icon: 'IconCalendarX',
      isNullable: true,
    },
    {
      universalIdentifier: CAMPAIGN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: "'ACTIVE'",
      options: [
        { id: '0e0f3c6a-2d57-4a45-9d40-3f1b6c1e6a01', value: 'ACTIVE', label: 'Active', position: 0, color: 'green' },
        { id: '0e0f3c6a-2d57-4a45-9d40-3f1b6c1e6a02', value: 'ENDED', label: 'Ended', position: 1, color: 'gray' },
      ],
    },
    {
      universalIdentifier: CAMPAIGN_AVAILABLE_USER_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'availableUserCount',
      label: 'Available Users',
      description: 'Unowned Users available in this Campaign. Refreshed by the app.',
      icon: 'IconUsers',
      isNullable: true,
      isUIEditable: false,
    },
    {
      universalIdentifier: CAMPAIGN_ADMINS_ON_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'campaignAdmins',
      label: 'Admins',
      icon: 'IconHeadset',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        CAMPAIGN_ADMIN_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CAMPAIGN_ON_CAMPAIGN_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: { relationType: RelationType.ONE_TO_MANY },
    },
  ],
});
