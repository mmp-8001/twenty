import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_FIRST_ANSWERED_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER =
  'b3c43b86-e79b-413c-9ea0-d5775825c62a';

export default defineField({
  universalIdentifier: OPPORTUNITY_FIRST_ANSWERED_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'firstAnsweredCallAt',
  label: 'First answered call at',
  icon: 'IconPhoneCheck',
  isNullable: true,
});
