import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_DEADLINE_AT_FIELD_UNIVERSAL_IDENTIFIER =
  '86efaae1-755c-4a3e-87d6-b8b4f65e08b8';

export default defineField({
  universalIdentifier: OPPORTUNITY_DEADLINE_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'deadlineAt',
  label: 'Deadline at',
  icon: 'IconClock',
  isNullable: true,
});
