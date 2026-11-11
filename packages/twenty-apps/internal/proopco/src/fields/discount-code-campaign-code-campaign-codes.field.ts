import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  CAMPAIGN_CODE_CODE_FIELD_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_CAMPAIGN_CODE_CAMPAIGN_CODES_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/campaign-code-code.field';

export default defineField({
  universalIdentifier: DISCOUNT_CODE_CAMPAIGN_CODE_CAMPAIGN_CODES_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'campaignCodes',
  label: 'Campaign codes',
  icon: 'IconTicket',
  relationTargetObjectMetadataUniversalIdentifier:
    CAMPAIGN_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CAMPAIGN_CODE_CODE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
