import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CAMPAIGN_CODE_CODE_FIELD_UNIVERSAL_IDENTIFIER =
  '5dc1bb80-bbf3-4508-8ada-d80759bfe76a';
export const DISCOUNT_CODE_CAMPAIGN_CODE_CAMPAIGN_CODES_FIELD_UNIVERSAL_IDENTIFIER =
  '8b00f007-1404-4d96-a7b3-7d4351e1bd88';

export default defineField({
  universalIdentifier: CAMPAIGN_CODE_CODE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CAMPAIGN_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'code',
  label: 'Code',
  icon: 'IconTicket',
  relationTargetObjectMetadataUniversalIdentifier:
    DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    DISCOUNT_CODE_CAMPAIGN_CODE_CAMPAIGN_CODES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'codeId',
  },
});
