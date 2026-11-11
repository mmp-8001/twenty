import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  FREEZE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const FREEZE_PERIOD_STARTED_BY_FIELD_UNIVERSAL_IDENTIFIER =
  'c8264b36-8f4e-4412-a41f-3253b156f5a3';
export const WORKSPACEMEMBER_FREEZE_PERIOD_STARTED_FREEZE_PERIODS_FIELD_UNIVERSAL_IDENTIFIER =
  'fe64da68-7245-4fb8-8d9e-bf0a3aa2a4dc';

export default defineField({
  universalIdentifier: FREEZE_PERIOD_STARTED_BY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: FREEZE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'startedBy',
  label: 'Started by',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACEMEMBER_FREEZE_PERIOD_STARTED_FREEZE_PERIODS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'startedById',
  },
});
