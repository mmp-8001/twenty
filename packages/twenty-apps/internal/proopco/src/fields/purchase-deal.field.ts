import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export const PURCHASE_DEAL_FIELD_UNIVERSAL_IDENTIFIER =
  'f9dca70f-abde-4117-a0e0-f55176b811de';
export const OPPORTUNITY_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER =
  'f049f9b5-fd03-4d86-ba84-07e9c5f2ad51';

export default defineField({
  universalIdentifier: PURCHASE_DEAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'deal',
  label: 'Deal',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    OPPORTUNITY_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'dealId',
  },
});
