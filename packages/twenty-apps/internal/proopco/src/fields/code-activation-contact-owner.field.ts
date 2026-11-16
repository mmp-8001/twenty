import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CODE_ACTIVATION_CONTACT_OWNER_FIELD_UNIVERSAL_IDENTIFIER =
  'c84224c8-3781-48dc-ae6a-8f7b6acdf87d';
export const AGENT_CODE_ACTIVATION_CONTACT_OWNED_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER =
  '64ce84bb-05f1-42eb-afe1-0e899d500ad5';

export default defineField({
  universalIdentifier: CODE_ACTIVATION_CONTACT_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'contactOwner',
  label: 'Contact owner',
  icon: 'IconHeadset',
  relationTargetObjectMetadataUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AGENT_CODE_ACTIVATION_CONTACT_OWNED_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'contactOwnerId',
  },
});
