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

export const AUDIT_LOG_CONTACT_FIELD_UNIVERSAL_IDENTIFIER =
  '68bfcd59-2081-4060-821a-3341d6f06e46';
export const PERSON_AUDIT_LOG_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER =
  '875d59e8-1ce8-4954-b45e-8bcebbd33781';

export default defineField({
  universalIdentifier: AUDIT_LOG_CONTACT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: AUDIT_LOG_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'contact',
  label: 'Contact',
  icon: 'IconUser',
  relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: PERSON_AUDIT_LOG_AUDIT_LOGS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'contactId',
  },
});
