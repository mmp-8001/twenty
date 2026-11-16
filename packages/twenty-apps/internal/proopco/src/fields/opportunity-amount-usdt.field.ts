import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_AMOUNT_USDT_FIELD_UNIVERSAL_IDENTIFIER =
  '471c82c9-bc89-4491-a060-43aff467bf20';

export default defineField({
  universalIdentifier: OPPORTUNITY_AMOUNT_USDT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.NUMBER,
  name: 'amountUsdt',
  label: 'Amount (USDT)',
  icon: 'IconCoin',
  isNullable: true,
  universalSettings: { decimals: 2 },
});
