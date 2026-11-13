import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const OPPORTUNITY_CONTACT_OWNER_FIELD_UNIVERSAL_IDENTIFIER =
  '26926840-6b7c-412a-b2e7-910fffe98a9c';
export const AGENT_CONTACT_OWNED_DEALS_FIELD_UNIVERSAL_IDENTIFIER =
  '03c15346-4717-4f1d-8ce7-c44551cda297';

export default defineField({
  universalIdentifier: OPPORTUNITY_CONTACT_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.RELATION,
  name: 'contactOwner',
  label: 'Contact owner',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier:
    AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    AGENT_CONTACT_OWNED_DEALS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'contactOwnerId',
  },
});
