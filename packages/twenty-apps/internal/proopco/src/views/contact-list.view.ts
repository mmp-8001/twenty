import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewType,
} from 'twenty-sdk/define';

import {
  CONTACT_LIST_VIEW_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  CONTACT_LIST_VIEW_PLATFORM_USER_ID_FIELD_UNIVERSAL_IDENTIFIER,
  CONTACT_LIST_VIEW_SIGNUP_FIELD_UNIVERSAL_IDENTIFIER,
  CONTACT_LIST_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { PERSON_PLATFORM_USER_ID_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-platform-user-id.field';
import { PERSON_SIGNUP_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-signup-at.field';

// Narrowed to Free contacts by the lifecycle ticket; the row rule narrows it per agent.
export default defineView({
  universalIdentifier: CONTACT_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Contact list',
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: ViewType.TABLE,
  icon: 'IconUsers',
  position: 0,
  fields: [
    {
      universalIdentifier: CONTACT_LIST_VIEW_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.fields.name
          .universalIdentifier,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier:
        CONTACT_LIST_VIEW_PLATFORM_USER_ID_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        PERSON_PLATFORM_USER_ID_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: CONTACT_LIST_VIEW_SIGNUP_FIELD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        PERSON_SIGNUP_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
  ],
});
