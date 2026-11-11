import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_HAS_PROFIT_WITHDRAWAL_FIELD_UNIVERSAL_IDENTIFIER =
  '8b19bd4e-0d08-49f5-a582-27ed5048f2dc';

export default defineField({
  universalIdentifier: PERSON_HAS_PROFIT_WITHDRAWAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.BOOLEAN,
  name: 'hasProfitWithdrawal',
  label: 'Has profit withdrawal',
  icon: 'IconCashBanknote',
  isNullable: true,
});
