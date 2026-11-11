import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  REASON_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const OPPORTUNITY_DO_NOT_CONTACT_REASON_FIELD_UNIVERSAL_IDENTIFIER =
  '4dfbdd13-8472-4f0f-ba36-963c7f4cf8ca';
export const REASON_DO_NOT_CONTACT_DEALS_FIELD_UNIVERSAL_IDENTIFIER =
  '781f5030-7467-4339-b67a-3dac010360e6';

export default defineField({
  universalIdentifier: OPPORTUNITY_DO_NOT_CONTACT_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.RELATION,
  name: 'doNotContactReason',
  label: 'Do not contact reason',
  icon: 'IconBan',
  relationTargetObjectMetadataUniversalIdentifier:
    REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    REASON_DO_NOT_CONTACT_DEALS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'doNotContactReasonId',
  },
});
