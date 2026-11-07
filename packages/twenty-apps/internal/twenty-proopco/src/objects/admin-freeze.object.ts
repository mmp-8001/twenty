import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ADMIN_FREEZE_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  ADMIN_FREEZE_FROZEN_AT_FIELD_UNIVERSAL_IDENTIFIER,
  ADMIN_FREEZE_FROZEN_BY_ID_FIELD_UNIVERSAL_IDENTIFIER,
  ADMIN_FREEZE_OBJECT_UNIVERSAL_IDENTIFIER,
  ADMIN_FREEZE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  ADMIN_FREEZE_UNFROZEN_AT_FIELD_UNIVERSAL_IDENTIFIER,
  ADMIN_FREEZE_UNFROZEN_BY_ID_FIELD_UNIVERSAL_IDENTIFIER,
  ADMIN_FREEZE_WARNED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  ADMIN_FREEZES_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Written by the app only: freeze and unfreeze are routes that check the caller's role.
export default defineObject({
  universalIdentifier: ADMIN_FREEZE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'adminFreeze',
  namePlural: 'adminFreezes',
  labelSingular: 'Admin freeze',
  labelPlural: 'Admin freezes',
  description: 'One freeze of an Admin. Open while unfrozen at is empty.',
  icon: 'IconSnowflake',
  disabledObjectPermissionActions: [
    'canUpdateObjectRecords',
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  isUICreatable: false,
  isUIEditable: false,
  labelIdentifierFieldMetadataUniversalIdentifier:
    ADMIN_FREEZE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: ADMIN_FREEZE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'reason',
      label: 'Reason',
      icon: 'IconMessage',
    },
    {
      universalIdentifier: ADMIN_FREEZE_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'admin',
      label: 'Admin',
      icon: 'IconHeadset',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        ADMIN_FREEZES_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'adminId',
      },
    },
    {
      universalIdentifier: ADMIN_FREEZE_FROZEN_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'frozenAt',
      label: 'Frozen at',
      icon: 'IconCalendarPlus',
      isNullable: true,
    },
    {
      universalIdentifier: ADMIN_FREEZE_FROZEN_BY_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'frozenById',
      label: 'Frozen by',
      description: 'Workspace member id.',
      icon: 'IconUser',
      isNullable: true,
    },
    {
      universalIdentifier: ADMIN_FREEZE_UNFROZEN_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'unfrozenAt',
      label: 'Unfrozen at',
      description: 'Empty while the freeze is open.',
      icon: 'IconCalendarX',
      isNullable: true,
    },
    {
      universalIdentifier: ADMIN_FREEZE_UNFROZEN_BY_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'unfrozenById',
      label: 'Unfrozen by',
      description: 'Workspace member id.',
      icon: 'IconUser',
      isNullable: true,
    },
    {
      universalIdentifier: ADMIN_FREEZE_WARNED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'warnedAt',
      label: 'Long-freeze warning at',
      description: 'Set by the daily job once the freeze passes the warning threshold.',
      icon: 'IconAlertTriangle',
      isNullable: true,
    },
  ],
});
