import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  FREEZE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const AUDIT_LOG_FREEZE_PERIOD_FIELD_UNIVERSAL_IDENTIFIER =
  '426fef24-9473-48f4-9c4c-e88e1139867b';
export const FREEZE_PERIOD_AUDIT_LOG_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER =
  '24e3dfc4-5f6d-4f3c-b639-586279c4e2de';

export default defineField({
  universalIdentifier: AUDIT_LOG_FREEZE_PERIOD_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'freezePeriod',
  label: 'Freeze period',
  icon: 'IconSnowflake',
  relationTargetObjectMetadataUniversalIdentifier: FREEZE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: FREEZE_PERIOD_AUDIT_LOG_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'freezePeriodId',
  },
});
