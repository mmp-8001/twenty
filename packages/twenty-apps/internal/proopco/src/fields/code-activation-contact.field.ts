import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CODE_ACTIVATION_CONTACT_FIELD_UNIVERSAL_IDENTIFIER =
  '0669b224-f5ef-42b1-80ad-58929c83c2ee';
export const PERSON_CODE_ACTIVATION_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER =
  '9860d4f3-d336-4d92-abdc-b3fda12b9042';

export default defineField({
  universalIdentifier: CODE_ACTIVATION_CONTACT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'contact',
  label: 'Contact',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    PERSON_CODE_ACTIVATION_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.RESTRICT,
    joinColumnName: 'contactId',
  },
});
