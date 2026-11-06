import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PERSON_VISIBLE_TO_MEMBER_IDS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: PERSON_VISIBLE_TO_MEMBER_IDS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.ARRAY,
  name: 'visibleToMemberIds',
  label: 'Visible to members',
  description: 'Workspace member ids whose User list holds this User. Recomputed by the app.',
  icon: 'IconEye',
  isNullable: true,
  isUIEditable: false,
});
