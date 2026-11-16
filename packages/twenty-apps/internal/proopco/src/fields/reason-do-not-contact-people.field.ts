import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  REASON_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { PERSON_DO_NOT_CONTACT_REASON_FIELD_UNIVERSAL_IDENTIFIER, REASON_DO_NOT_CONTACT_PEOPLE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-do-not-contact-reason.field';

export default defineField({
  universalIdentifier: REASON_DO_NOT_CONTACT_PEOPLE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'doNotContactPeople',
  label: 'Do not contact people',
  icon: 'IconBan',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    PERSON_DO_NOT_CONTACT_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
