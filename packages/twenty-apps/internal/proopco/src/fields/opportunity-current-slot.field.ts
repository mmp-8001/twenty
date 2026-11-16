import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_CURRENT_SLOT_FIELD_UNIVERSAL_IDENTIFIER =
  '29e7c213-0f72-47a1-9c1b-d9219490f731';

export default defineField({
  universalIdentifier: OPPORTUNITY_CURRENT_SLOT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.NUMBER,
  name: 'currentSlot',
  label: 'Current slot',
  icon: 'IconListNumbers',
  defaultValue: 0,
});
