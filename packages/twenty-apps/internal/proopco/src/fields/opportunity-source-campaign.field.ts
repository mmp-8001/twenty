import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const OPPORTUNITY_SOURCE_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER =
  '1bc45b64-ded8-4379-a6b7-56a0e03b2e64';
export const CAMPAIGN_DEALS_FIELD_UNIVERSAL_IDENTIFIER =
  '91a8d938-73bd-4364-b497-0baf8ca6467c';

export default defineField({
  universalIdentifier: OPPORTUNITY_SOURCE_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.RELATION,
  name: 'sourceCampaign',
  label: 'Source campaign',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier:
    CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CAMPAIGN_DEALS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'sourceCampaignId',
  },
});
