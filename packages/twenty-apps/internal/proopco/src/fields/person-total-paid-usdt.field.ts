import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_TOTAL_PAID_USDT_FIELD_UNIVERSAL_IDENTIFIER =
  '26871a73-b5f2-4528-b21a-ee5ab70bfa83';

export default defineField({
  universalIdentifier: PERSON_TOTAL_PAID_USDT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.NUMBER,
  name: 'totalPaidUsdt',
  label: 'Total paid (USDT)',
  icon: 'IconCoin',
  isNullable: true,
  universalSettings: { decimals: 2 },
});
