import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PERSON_PERMANENTLY_FAILED_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: PERSON_PERMANENTLY_FAILED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'permanentlyFailedAt',
  label: 'Permanently failed at',
  description: 'Set when the User is closed as permanently failed; the User never returns to a User list.',
  icon: 'IconBan',
  isNullable: true,
  isUIEditable: false,
});
