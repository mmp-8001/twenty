import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CALLS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  CALL_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: CALLS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'calls',
  label: 'Calls',
  icon: 'IconPhone',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CALL_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
