import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  COMMISSIONS_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_ACTIVE_TRADER_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_RETRY_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
  COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUPS_ON_FOLLOWUP_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUPS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUPS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  OWNER_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
  TRADER_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
  TYPE_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  FOLLOWUP_FAILURE_REASON_OPTIONS,
  FOLLOWUP_STAGE_OPTIONS,
} from 'src/constants/followup.constant';

export default defineObject({
  universalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'followup',
  namePlural: 'followups',
  labelSingular: 'Followup',
  labelPlural: 'Followups',
  description: 'An agent working a Trader towards a purchase.',
  icon: 'IconPhoneCall',
  // Followups are created only by the Track command.
  isUICreatable: false,
  labelIdentifierFieldMetadataUniversalIdentifier:
    FOLLOWUP_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: FOLLOWUP_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconTag',
    },
    {
      universalIdentifier: FOLLOWUP_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'stage',
      label: 'Stage',
      icon: 'IconProgress',
      defaultValue: "'PENDING'",
      options: [...FOLLOWUP_STAGE_OPTIONS],
    },
    {
      universalIdentifier: FOLLOWUP_ACTIVE_TRADER_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'activeTraderKey',
      label: 'Active trader key',
      description:
        'The Trader id while the Followup is active, empty otherwise. Its unique index allows one active Followup per Trader.',
      icon: 'IconKey',
      isNullable: true,
    },
    {
      universalIdentifier: FOLLOWUP_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'expiresAt',
      label: 'Expires at',
      icon: 'IconClockOff',
      isNullable: true,
    },
    {
      universalIdentifier: FOLLOWUP_RETRY_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'retryExpiresAt',
      label: 'Retry expires at',
      description: 'When the retry window, or the Pool stay, ends.',
      icon: 'IconClockPause',
      isNullable: true,
    },
    {
      universalIdentifier: FOLLOWUP_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'failureReason',
      label: 'Failure reason',
      icon: 'IconAlertTriangle',
      isNullable: true,
      options: [...FOLLOWUP_FAILURE_REASON_OPTIONS],
    },
    {
      universalIdentifier: TYPE_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'followupType',
      label: 'Followup Type',
      icon: 'IconListDetails',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        FOLLOWUP_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        FOLLOWUPS_ON_FOLLOWUP_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'followupTypeId',
      },
    },
    {
      universalIdentifier: TRADER_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'trader',
      label: 'Trader',
      icon: 'IconUser',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        FOLLOWUPS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'traderId',
      },
    },
    {
      universalIdentifier: OWNER_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'owner',
      label: 'Owner',
      description: 'Agent working the Followup. Empty means it is in the Pool.',
      icon: 'IconUserCircle',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember
          .universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        FOLLOWUPS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'ownerId',
      },
    },
    {
      universalIdentifier: COMMISSIONS_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'commissions',
      label: 'Commissions',
      icon: 'IconCoin',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        FOLLOWUP_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: { relationType: RelationType.ONE_TO_MANY },
    },
  ],
});
