import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_OPENED_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '3ee71f30-9b2e-4c1a-b437-016da351ace5';

export default defineField({
  universalIdentifier: OPPORTUNITY_OPENED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'openedAt',
  label: 'Opened at',
  icon: 'IconCalendarEvent',
  isNullable: true,
});
