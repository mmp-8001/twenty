import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_LAST_FREEZE_SHIFT_ID_FIELD_UNIVERSAL_IDENTIFIER =
  'c3b7f0a2-5d41-4c8e-9a6b-7e2d1f4a8b05';

export default defineField({
  universalIdentifier: PERSON_LAST_FREEZE_SHIFT_ID_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.TEXT,
  name: 'lastFreezeShiftId',
  label: 'Last freeze shift ID',
  icon: 'IconId',
  isNullable: true,
});
