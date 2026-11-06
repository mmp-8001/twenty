import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PERSON_HAS_PROFIT_WITHDRAWAL_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: PERSON_HAS_PROFIT_WITHDRAWAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.BOOLEAN,
  name: 'hasProfitWithdrawal',
  label: 'Has profit withdrawal',
  description: 'Whether the User has withdrawn profit, synced from proopco.',
  icon: 'IconCashBanknote',
  isNullable: true,
  isUIEditable: false,
});
