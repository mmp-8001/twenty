import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CAMPAIGN_CODE_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER =
  '3a85aae1-15aa-470c-a77b-6f6af97de5f1';
export const CAMPAIGN_CAMPAIGN_CODE_CAMPAIGN_CODES_FIELD_UNIVERSAL_IDENTIFIER =
  'a5e12d8c-c551-45de-a1ff-b94779f4d760';

export default defineField({
  universalIdentifier: CAMPAIGN_CODE_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CAMPAIGN_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'campaign',
  label: 'Campaign',
  icon: 'IconSpeakerphone',
  relationTargetObjectMetadataUniversalIdentifier:
    CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CAMPAIGN_CAMPAIGN_CODE_CAMPAIGN_CODES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'campaignId',
  },
});
