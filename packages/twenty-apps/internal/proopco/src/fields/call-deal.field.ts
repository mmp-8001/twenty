import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CALL_DEAL_FIELD_UNIVERSAL_IDENTIFIER =
  '94a4c1a9-2ba1-41f1-91d1-d851c2f2c6d8';
export const OPPORTUNITY_CALLS_FIELD_UNIVERSAL_IDENTIFIER =
  '2e400e7b-f8a6-4613-a6ed-f9754b51c2f2';

export default defineField({
  universalIdentifier: CALL_DEAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'deal',
  label: 'Deal',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    OPPORTUNITY_CALLS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'dealId',
  },
});
