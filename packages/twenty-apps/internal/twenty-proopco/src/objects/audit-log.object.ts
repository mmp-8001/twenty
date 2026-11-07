import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { AUDIT_ACTIONS } from 'src/constants/admin-management.constant';
import {
  AUDIT_LOG_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
  AUDIT_LOG_ACTOR_FIELD_UNIVERSAL_IDENTIFIER,
  AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  AUDIT_LOG_PAYLOAD_FIELD_UNIVERSAL_IDENTIFIER,
  AUDIT_LOG_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  AUDIT_LOG_SUBJECT_ID_FIELD_UNIVERSAL_IDENTIFIER,
  AUDIT_LOG_SUBJECT_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  AUDIT_LOGS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { buildSelectOptions } from 'src/utils/build-select-options.util';

// Append-only. No assignable role updates or deletes an entry; only the app writes it.
export default defineObject({
  universalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'auditLog',
  namePlural: 'auditLogs',
  labelSingular: 'Audit log entry',
  labelPlural: 'Audit log',
  description: 'Who did what to whom, and why. Never edited or deleted.',
  icon: 'IconHistory',
  disabledObjectPermissionActions: [
    'canUpdateObjectRecords',
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  isUICreatable: false,
  isUIEditable: false,
  labelIdentifierFieldMetadataUniversalIdentifier:
    AUDIT_LOG_SUBJECT_ID_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: AUDIT_LOG_SUBJECT_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'subjectId',
      label: 'Subject id',
      icon: 'IconKey',
    },
    {
      universalIdentifier: AUDIT_LOG_ACTION_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'action',
      label: 'Action',
      icon: 'IconBolt',
      defaultValue: "'TRANSFER'",
      options: buildSelectOptions('auditLog.action', AUDIT_ACTIONS),
    },
    {
      universalIdentifier: AUDIT_LOG_ACTOR_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'actor',
      label: 'Actor',
      icon: 'IconUser',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        AUDIT_LOGS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'actorId',
      },
    },
    {
      universalIdentifier: AUDIT_LOG_SUBJECT_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'subjectType',
      label: 'Subject type',
      icon: 'IconCategory',
      isNullable: true,
    },
    {
      universalIdentifier: AUDIT_LOG_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'reason',
      label: 'Reason',
      icon: 'IconMessage',
      isNullable: true,
    },
    {
      universalIdentifier: AUDIT_LOG_PAYLOAD_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RAW_JSON,
      name: 'payload',
      label: 'Payload',
      icon: 'IconBraces',
      isNullable: true,
    },
  ],
});
