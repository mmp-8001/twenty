import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewType,
} from 'twenty-sdk/define';

import {
  PERSON_CANDIDATE_CAMPAIGN_IDS_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_CURRENT_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_KYC_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_LAST_LOGIN_AT_FIELD_UNIVERSAL_IDENTIFIER,
  USER_LIST_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const person = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person;

// Row-level access scopes the rows; filter by Candidate campaigns to see one Campaign.
export default defineView({
  universalIdentifier: USER_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'User list',
  objectUniversalIdentifier: person.universalIdentifier,
  type: ViewType.TABLE,
  icon: 'IconUsers',
  position: 0,
  fields: [
    {
      universalIdentifier: '63769fc0-04aa-4f1a-b0a5-58a462e8e74e',
      fieldMetadataUniversalIdentifier:
        person.fields.name.universalIdentifier,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '02c64106-9592-4eb0-826f-2304bd1f3912',
      fieldMetadataUniversalIdentifier:
        person.fields.phones.universalIdentifier,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'cbd3a1fc-f543-4c39-b315-46a1e017d08f',
      fieldMetadataUniversalIdentifier:
        PERSON_KYC_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '42f8d133-24e6-47b1-ad89-f2b831fb300b',
      fieldMetadataUniversalIdentifier:
        PERSON_LAST_LOGIN_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '38a375d9-92bc-44f9-bdd6-cb0400b33cdf',
      fieldMetadataUniversalIdentifier:
        PERSON_CANDIDATE_CAMPAIGN_IDS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '3492bd2d-964b-4e8a-9436-091b4d72630d',
      fieldMetadataUniversalIdentifier:
        PERSON_CURRENT_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 160,
    },
  ],
});
