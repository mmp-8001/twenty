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

export const FREEZE_PERIOD_ENDED_BY_FIELD_UNIVERSAL_IDENTIFIER =
  '1d5801ea-daeb-4f18-840f-24249be64f2e';
export const WORKSPACEMEMBER_FREEZE_PERIOD_ENDED_FREEZE_PERIODS_FIELD_UNIVERSAL_IDENTIFIER =
  '2ec468c9-80c2-418d-bcb5-bfae88301cdd';

export default defineField({
  universalIdentifier: FREEZE_PERIOD_ENDED_BY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: FREEZE_PERIOD_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'endedBy',
  label: 'Ended by',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACEMEMBER_FREEZE_PERIOD_ENDED_FREEZE_PERIODS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'endedById',
  },
});
