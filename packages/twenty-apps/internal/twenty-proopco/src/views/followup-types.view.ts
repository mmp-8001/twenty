import { defineView, ViewType } from 'twenty-sdk/define';

import {
  FOLLOWUP_TYPES_VIEW_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_TYPE_COMMISSIONABLE_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_TYPE_EXPIRY_DAYS_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_TYPE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: FOLLOWUP_TYPES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Followup Types',
  objectUniversalIdentifier: FOLLOWUP_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconListDetails',
  position: 0,
  fields: [
    {
      universalIdentifier: '4f37def8-1e17-4d03-98ff-b1d7e3ad99fa',
      fieldMetadataUniversalIdentifier:
        FOLLOWUP_TYPE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '7f6bf4a5-9c14-45f7-904b-485793f0e07e',
      fieldMetadataUniversalIdentifier:
        FOLLOWUP_TYPE_EXPIRY_DAYS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'dd8f52d1-209f-4519-b745-7fdcfcd3c06f',
      fieldMetadataUniversalIdentifier:
        FOLLOWUP_TYPE_COMMISSIONABLE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
  ],
});
