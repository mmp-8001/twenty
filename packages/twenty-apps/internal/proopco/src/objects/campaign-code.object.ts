import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  CAMPAIGN_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_CODE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: CAMPAIGN_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'campaignCode',
  namePlural: 'campaignCodes',
  labelSingular: 'Campaign code',
  labelPlural: 'Campaign codes',
  description: 'Links a code to a campaign',
  icon: 'IconTicket',
  labelIdentifierFieldMetadataUniversalIdentifier:
    CAMPAIGN_CODE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: CAMPAIGN_CODE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
      defaultValue: "''",
    },
  ],
});
