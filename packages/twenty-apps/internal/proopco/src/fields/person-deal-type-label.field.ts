import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_DEAL_TYPE_LABEL_FIELD_UNIVERSAL_IDENTIFIER =
  '3d81587c-af4e-441f-aa96-c6b05a592df8';

export default defineField({
  universalIdentifier: PERSON_DEAL_TYPE_LABEL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.TEXT,
  name: 'dealTypeLabel',
  label: 'Deal type',
  icon: 'IconTag',
  isNullable: true,
});
