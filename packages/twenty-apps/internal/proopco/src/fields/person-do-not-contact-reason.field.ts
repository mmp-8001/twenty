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

export const PERSON_DO_NOT_CONTACT_REASON_FIELD_UNIVERSAL_IDENTIFIER =
  '8aa7f849-8268-48c8-bf3b-2a9993f43941';
export const REASON_DO_NOT_CONTACT_PEOPLE_FIELD_UNIVERSAL_IDENTIFIER =
  '6119bcb5-bb08-4f96-aff6-f0f40fe8b38d';

export default defineField({
  universalIdentifier: PERSON_DO_NOT_CONTACT_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'doNotContactReason',
  label: 'Do not contact reason',
  icon: 'IconBan',
  relationTargetObjectMetadataUniversalIdentifier:
    REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    REASON_DO_NOT_CONTACT_PEOPLE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'doNotContactReasonId',
  },
});
