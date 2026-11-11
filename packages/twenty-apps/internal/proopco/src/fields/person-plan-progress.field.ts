import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_PLAN_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER =
  '4db748f7-d6a1-4e8c-a78f-675bd232579d';

export default defineField({
  universalIdentifier: PERSON_PLAN_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.TEXT,
  name: 'planProgress',
  label: 'Plan progress',
  icon: 'IconListDetails',
  isNullable: true,
});
