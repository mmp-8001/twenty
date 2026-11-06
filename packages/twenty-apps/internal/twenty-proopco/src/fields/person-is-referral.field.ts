import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PERSON_IS_REFERRAL_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: PERSON_IS_REFERRAL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.BOOLEAN,
  name: 'isReferral',
  label: 'Is referral',
  description: 'Whether the User came through a referral, synced from proopco.',
  icon: 'IconUsersGroup',
  isNullable: true,
  isUIEditable: false,
});
