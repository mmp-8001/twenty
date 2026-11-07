import { defineField, FieldType } from 'twenty-sdk/define';

import {
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  CALL_VISIBLE_TO_MEMBER_IDS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: CALL_VISIBLE_TO_MEMBER_IDS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.ARRAY,
  name: 'visibleToMemberIds',
  label: 'Visible to members',
  description: 'The Agent who made the call and every later owner of the User. Set by the app.',
  icon: 'IconEye',
  isNullable: true,
  isUIEditable: false,
});
