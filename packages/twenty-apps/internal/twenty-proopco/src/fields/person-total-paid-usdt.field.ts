import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PERSON_TOTAL_PAID_USDT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: PERSON_TOTAL_PAID_USDT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.NUMERIC,
  name: 'totalPaidUsdt',
  label: 'Total paid (USDT)',
  description: 'Total settled payments in USDT, synced from proopco.',
  icon: 'IconCurrencyDollar',
  isNullable: true,
  isUIEditable: false,
});
