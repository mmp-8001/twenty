import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  CHALLENGE_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  CHALLENGE_ACCOUNT_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  PAYMENTS_ON_CHALLENGE_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier:
    PAYMENTS_ON_CHALLENGE_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CHALLENGE_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'payments',
  label: 'Payments',
  description: 'Payments that bought this Challenge Account.',
  icon: 'IconCash',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier:
    PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CHALLENGE_ACCOUNT_ON_PAYMENT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
