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

export const AUDIT_LOG_NEW_DEAL_FIELD_UNIVERSAL_IDENTIFIER =
  'a00ae954-d1fc-439f-9ab1-beedde230c9d';
export const OPPORTUNITY_AUDIT_LOG_NEW_DEAL_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER =
  '80de431f-559f-4cf9-b3ef-62d0030b9c96';

export default defineField({
  universalIdentifier: AUDIT_LOG_NEW_DEAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'newDeal',
  label: 'New deal',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: OPPORTUNITY_AUDIT_LOG_NEW_DEAL_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'newDealId',
  },
});
