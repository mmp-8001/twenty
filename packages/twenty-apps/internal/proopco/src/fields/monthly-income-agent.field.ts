import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const MONTHLY_INCOME_AGENT_FIELD_UNIVERSAL_IDENTIFIER =
  'e3cdb9bc-9a69-4f6b-a377-c3659c3d2aa6';
export const AGENT_MONTHLY_INCOMES_FIELD_UNIVERSAL_IDENTIFIER =
  'b1750684-abd2-4c25-8072-38d1a7b57d1b';

export default defineField({
  universalIdentifier: MONTHLY_INCOME_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'agent',
  label: 'Agent',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: AGENT_MONTHLY_INCOMES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'agentId',
  },
});
