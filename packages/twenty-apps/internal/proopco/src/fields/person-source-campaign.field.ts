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

export const PERSON_SOURCE_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER =
  '6baa9ce8-0f06-439c-afc3-364efcf91b78';
export const CAMPAIGN_SOURCE_PEOPLE_FIELD_UNIVERSAL_IDENTIFIER =
  '3b01146d-b9f3-4650-80b7-23022f108835';

export default defineField({
  universalIdentifier: PERSON_SOURCE_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'sourceCampaign',
  label: 'Source campaign',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier:
    CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CAMPAIGN_SOURCE_PEOPLE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'sourceCampaignId',
  },
});
