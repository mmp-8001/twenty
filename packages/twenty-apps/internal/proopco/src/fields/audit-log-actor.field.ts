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

export const AUDIT_LOG_ACTOR_FIELD_UNIVERSAL_IDENTIFIER =
  'b674d874-a09e-4f39-a897-7abea325366d';
export const WORKSPACEMEMBER_AUDIT_LOG_ACTED_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER =
  'b75cfb0e-4a18-4c19-9fdc-ce171329fe1b';

export default defineField({
  universalIdentifier: AUDIT_LOG_ACTOR_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'actor',
  label: 'Actor',
  icon: 'IconUserCircle',
  relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: WORKSPACEMEMBER_AUDIT_LOG_ACTED_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'actorId',
  },
});
