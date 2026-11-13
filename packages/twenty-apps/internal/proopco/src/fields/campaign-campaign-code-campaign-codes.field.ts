import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  CAMPAIGN_CODE_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_CAMPAIGN_CODE_CAMPAIGN_CODES_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/fields/campaign-code-campaign.field';

export default defineField({
  universalIdentifier: CAMPAIGN_CAMPAIGN_CODE_CAMPAIGN_CODES_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'campaignCodes',
  label: 'Campaign codes',
  icon: 'IconSpeakerphone',
  relationTargetObjectMetadataUniversalIdentifier:
    CAMPAIGN_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CAMPAIGN_CODE_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
