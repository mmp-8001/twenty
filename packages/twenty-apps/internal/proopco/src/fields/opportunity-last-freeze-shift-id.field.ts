import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_LAST_FREEZE_SHIFT_ID_FIELD_UNIVERSAL_IDENTIFIER =
  '9d1fe56e-8eef-4e33-8da4-2b5a1b4c6334';

export default defineField({
  universalIdentifier: OPPORTUNITY_LAST_FREEZE_SHIFT_ID_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.TEXT,
  name: 'lastFreezeShiftId',
  label: 'Last freeze shift ID',
  icon: 'IconId',
  isNullable: true,
});
