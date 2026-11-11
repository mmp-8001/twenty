import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const AUDIT_LOG_DISCOUNT_CODE_FIELD_UNIVERSAL_IDENTIFIER =
  '31c345b9-605f-4ce5-81f6-d4248dabde70';
export const DISCOUNT_CODE_AUDIT_LOG_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER =
  '8e431c8c-fe1e-4bd3-8884-b119ee31bc2e';

export default defineField({
  universalIdentifier: AUDIT_LOG_DISCOUNT_CODE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'discountCode',
  label: 'Discount code',
  icon: 'IconTicket',
  relationTargetObjectMetadataUniversalIdentifier:
    DISCOUNT_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    DISCOUNT_CODE_AUDIT_LOG_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'discountCodeId',
  },
});
