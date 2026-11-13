import {
  defineView,
  ViewFilterOperand,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewType,
} from 'twenty-sdk/define';

import {
  CONTACT_LIST_VIEW_FILTER_UNIVERSAL_IDENTIFIER,
  CONTACT_LIST_VIEW_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  CONTACT_LIST_VIEW_PLATFORM_USER_ID_FIELD_UNIVERSAL_IDENTIFIER,
  CONTACT_LIST_VIEW_SIGNUP_FIELD_UNIVERSAL_IDENTIFIER,
  CONTACT_LIST_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { PERSON_LIFECYCLE_STAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-lifecycle-stage.field';
import { PERSON_PLATFORM_USER_ID_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-platform-user-id.field';
import { PERSON_SIGNUP_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-signup-at.field';

// Free contacts only; the row rule narrows them further per Agent.
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
  filters: [
    {
      universalIdentifier: CONTACT_LIST_VIEW_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        PERSON_LIFECYCLE_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['FREE'],
    },
  ],
});
