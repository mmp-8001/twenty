import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const MONTHLY_INCOME_PAID_BY_FIELD_UNIVERSAL_IDENTIFIER =
  'bf3bed0f-9be5-4a74-856d-dc38b530e5a7';
export const WORKSPACE_MEMBER_PAID_MONTHLY_INCOMES_FIELD_UNIVERSAL_IDENTIFIER =
  '68f2396d-303c-425e-972c-6a7c9adc2bb9';

export default defineField({
  universalIdentifier: MONTHLY_INCOME_PAID_BY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'paidBy',
  label: 'Paid by',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACE_MEMBER_PAID_MONTHLY_INCOMES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'paidById',
  },
});
