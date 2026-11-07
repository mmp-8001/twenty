import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  COMMISSION_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: COMMISSIONS_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'commissions',
  label: 'Commissions',
  icon: 'IconCoin',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier: COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: COMMISSION_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
