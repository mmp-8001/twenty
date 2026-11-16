import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const AUDIT_LOG_CLOSED_DEAL_FIELD_UNIVERSAL_IDENTIFIER =
  'a3f40b16-2a2c-4e1f-aa18-d648b38da389';
export const OPPORTUNITY_AUDIT_LOG_CLOSED_DEAL_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER =
  '01dd6471-f9aa-4299-8c38-d9b71545e3dd';

export default defineField({
  universalIdentifier: AUDIT_LOG_CLOSED_DEAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'closedDeal',
  label: 'Closed deal',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: OPPORTUNITY_AUDIT_LOG_CLOSED_DEAL_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'closedDealId',
  },
});
