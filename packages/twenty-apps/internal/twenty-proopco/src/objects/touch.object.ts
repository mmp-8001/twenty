import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { TOUCH_STATUSES } from 'src/constants/ownership.constant';
import {
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  TOUCH_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  TOUCH_COMPLETED_CALL_ID_FIELD_UNIVERSAL_IDENTIFIER,
  TOUCH_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
  TOUCH_NO_FIELD_UNIVERSAL_IDENTIFIER,
  TOUCH_OBJECT_UNIVERSAL_IDENTIFIER,
  TOUCH_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  TOUCH_WINDOW_END_AT_FIELD_UNIVERSAL_IDENTIFIER,
  TOUCH_WINDOW_START_AT_FIELD_UNIVERSAL_IDENTIFIER,
  TOUCHES_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
  TOUCHES_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { buildSelectOptions } from 'src/utils/build-select-options.util';

const manyToOne = (joinColumnName: string) => ({
  relationType: RelationType.MANY_TO_ONE,
  onDelete: OnDeleteAction.SET_NULL,
  joinColumnName,
});

export default defineObject({
  universalIdentifier: TOUCH_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'touch',
  namePlural: 'touches',
  labelSingular: 'Touch',
  labelPlural: 'Touches',
  description: 'One of the five call windows of a Followup.',
  icon: 'IconCalendarTime',
  disabledObjectPermissionActions: [
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  fields: [
    {
      universalIdentifier: TOUCH_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'followup',
      label: 'Followup',
      icon: 'IconPhoneCheck',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        TOUCHES_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: manyToOne('followupId'),
    },
    {
      universalIdentifier: TOUCH_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'admin',
      label: 'Admin',
      icon: 'IconHeadset',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        TOUCHES_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: manyToOne('adminId'),
    },
    {
      universalIdentifier: TOUCH_NO_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'touchNo',
      label: 'Touch number',
      icon: 'IconNumber',
      isNullable: true,
    },
    {
      universalIdentifier: TOUCH_WINDOW_START_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'windowStartAt',
      label: 'Window start',
      description: 'Inclusive.',
      icon: 'IconCalendarPlus',
      isNullable: true,
    },
    {
      universalIdentifier: TOUCH_WINDOW_END_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'windowEndAt',
      label: 'Window end',
      description: 'Exclusive.',
      icon: 'IconCalendarDue',
      isNullable: true,
    },
    {
      universalIdentifier: TOUCH_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: "'OPEN'",
      options: buildSelectOptions('touch.status', TOUCH_STATUSES),
    },
    {
      universalIdentifier: TOUCH_COMPLETED_CALL_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'completedCallId',
      label: 'Completed by call',
      description: 'The answered Call that completed this window.',
      icon: 'IconPhoneIncoming',
      isNullable: true,
    },
  ],
});
