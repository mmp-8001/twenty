import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER, AGENT_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export const PURCHASE_CREDITED_AGENT_FIELD_UNIVERSAL_IDENTIFIER =
  '3cc54ece-60df-4afb-baf9-4f2c2b317124';
export const AGENT_CREDITED_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER =
  '4c2d7602-2910-4cfe-afde-ec5c06234e3b';

export default defineField({
  universalIdentifier: PURCHASE_CREDITED_AGENT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'creditedAgent',
  label: 'Credited agent',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AGENT_CREDITED_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'creditedAgentId',
  },
});
