import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  FAILURE_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_ADDED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_CLOSED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_DEADLINE_AT_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_FIRST_ANSWERED_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_FROZEN_REMAINING_SECONDS_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_KIND_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OPEN_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OWNERSHIP_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUPS_ON_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUPS_ON_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUPS_ON_OWNERSHIP_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUPS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUPS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { FOLLOWUP_KINDS, FOLLOWUP_STATUSES } from 'src/constants/ownership.constant';
import { buildSelectOptions } from 'src/utils/build-select-options.util';

const manyToOne = (joinColumnName: string) => ({
  relationType: RelationType.MANY_TO_ONE,
  onDelete: OnDeleteAction.SET_NULL,
  joinColumnName,
});

// The Agent never changes: a transfer closes the case and opens a new one.
export default defineObject({
  universalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'followup',
  namePlural: 'followups',
  labelSingular: 'Followup',
  labelPlural: 'Followups',
  description: 'A permanent follow-up case for one User and one Agent.',
  icon: 'IconPhoneCheck',
  disabledObjectPermissionActions: [
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  fields: [
    {
      universalIdentifier: FOLLOWUP_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'person',
      label: 'User',
      icon: 'IconUser',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        FOLLOWUPS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: manyToOne('personId'),
    },
    {
      universalIdentifier: FOLLOWUP_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'admin',
      label: 'Agent',
      icon: 'IconHeadset',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        FOLLOWUPS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: manyToOne('adminId'),
    },
    {
      universalIdentifier: FOLLOWUP_OWNERSHIP_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'ownership',
      label: 'Ownership',
      icon: 'IconUserCheck',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        OWNERSHIP_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        FOLLOWUPS_ON_OWNERSHIP_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: manyToOne('ownershipId'),
    },
    {
      universalIdentifier: FOLLOWUP_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'campaign',
      label: 'Campaign',
      description: 'Empty for a rebuy Followup.',
      icon: 'IconSpeakerphone',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        FOLLOWUPS_ON_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: manyToOne('campaignId'),
    },
    {
      universalIdentifier: FOLLOWUP_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'failureReason',
      label: 'Failure reason',
      icon: 'IconFlag',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        FAILURE_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        FOLLOWUPS_ON_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: manyToOne('failureReasonId'),
    },
    {
      universalIdentifier: FOLLOWUP_KIND_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'kind',
      label: 'Kind',
      icon: 'IconCategory',
      defaultValue: "'CAMPAIGN'",
      options: buildSelectOptions('followup.kind', FOLLOWUP_KINDS),
    },
    {
      universalIdentifier: FOLLOWUP_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: "'PENDING_FIRST_CALL'",
      options: buildSelectOptions('followup.status', FOLLOWUP_STATUSES),
    },
    {
      universalIdentifier: FOLLOWUP_ADDED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'addedAt',
      label: 'Added at',
      icon: 'IconCalendarPlus',
      isNullable: true,
    },
    {
      universalIdentifier: FOLLOWUP_FIRST_ANSWERED_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'firstAnsweredCallAt',
      label: 'First answered call at',
      description: 'Starts the 30-day follow-up.',
      icon: 'IconPhoneIncoming',
      isNullable: true,
    },
    {
      universalIdentifier: FOLLOWUP_DEADLINE_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'deadlineAt',
      label: 'Deadline at',
      icon: 'IconCalendarDue',
      isNullable: true,
    },
    {
      universalIdentifier: FOLLOWUP_FROZEN_REMAINING_SECONDS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'frozenRemainingSeconds',
      label: 'Frozen remaining seconds',
      icon: 'IconSnowflake',
      isNullable: true,
    },
    {
      universalIdentifier: FOLLOWUP_CLOSED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'closedAt',
      label: 'Closed at',
      icon: 'IconCalendarX',
      isNullable: true,
    },
    {
      universalIdentifier: FOLLOWUP_OPEN_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'openKey',
      label: 'Open key',
      description: 'The User id while the Followup is open, empty after. A unique index allows one open Followup per User.',
      icon: 'IconKey',
      isNullable: true,
      isUIEditable: false,
    },
  ],
});
