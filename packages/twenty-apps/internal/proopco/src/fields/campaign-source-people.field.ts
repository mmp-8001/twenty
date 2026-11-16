import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { PERSON_SOURCE_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER, CAMPAIGN_SOURCE_PEOPLE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-source-campaign.field';

export default defineField({
  universalIdentifier: CAMPAIGN_SOURCE_PEOPLE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'sourcePeople',
  label: 'Source people',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    PERSON_SOURCE_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
