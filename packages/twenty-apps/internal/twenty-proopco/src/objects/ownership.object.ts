import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  OWNERSHIP_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_ENDED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_END_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_OBJECT_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_OPEN_USER_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_STARTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_STATE_FIELD_UNIVERSAL_IDENTIFIER,
  OWNERSHIPS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  OWNERSHIPS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  OWNERSHIP_END_REASONS,
  OWNERSHIP_STATES,
} from 'src/constants/ownership.constant';
import { buildSelectOptions } from 'src/utils/build-select-options.util';

export default defineObject({
  universalIdentifier: OWNERSHIP_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'ownership',
  namePlural: 'ownerships',
  labelSingular: 'Ownership',
  labelPlural: 'Ownerships',
  description: 'Which Agent owns a User, and for how long. Closed, never deleted.',
  icon: 'IconUserCheck',
  disabledObjectPermissionActions: [
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  fields: [
    {
      universalIdentifier: OWNERSHIP_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'person',
      label: 'User',
      icon: 'IconUser',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        OWNERSHIPS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'personId',
      },
    },
    {
      universalIdentifier: OWNERSHIP_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'admin',
      label: 'Agent',
      icon: 'IconHeadset',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        OWNERSHIPS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'adminId',
      },
    },
    {
      universalIdentifier: OWNERSHIP_STATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'state',
      label: 'State',
      icon: 'IconProgress',
      defaultValue: "'PENDING_FIRST_CALL'",
      options: buildSelectOptions('ownership.state', OWNERSHIP_STATES),
    },
    {
      universalIdentifier: OWNERSHIP_STARTED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'startedAt',
      label: 'Started at',
      icon: 'IconCalendarPlus',
      isNullable: true,
    },
    {
      universalIdentifier: OWNERSHIP_ENDED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'endedAt',
      label: 'Ended at',
      description: 'Empty while the Ownership is open.',
      icon: 'IconCalendarX',
      isNullable: true,
    },
    {
      universalIdentifier: OWNERSHIP_END_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'endReason',
      label: 'End reason',
      icon: 'IconFlag',
      isNullable: true,
      options: buildSelectOptions('ownership.endReason', OWNERSHIP_END_REASONS),
    },
    {
      universalIdentifier: OWNERSHIP_OPEN_USER_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'openUserKey',
      label: 'Open user key',
      description: 'The User id while the Ownership is open, empty after. A unique index allows one open Ownership per User.',
      icon: 'IconKey',
      isNullable: true,
      isUIEditable: false,
    },
  ],
});
