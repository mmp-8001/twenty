import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  FOLLOWUP_TYPE_COMMISSIONABLE_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_TYPE_EXPIRY_DAYS_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_TYPE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: FOLLOWUP_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'followupType',
  namePlural: 'followupTypes',
  labelSingular: 'Followup Type',
  labelPlural: 'Followup Types',
  description: 'Kind of Followup: how long it lasts and whether it pays.',
  icon: 'IconListDetails',
  labelIdentifierFieldMetadataUniversalIdentifier:
    FOLLOWUP_TYPE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: FOLLOWUP_TYPE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconTag',
    },
    {
      universalIdentifier: FOLLOWUP_TYPE_EXPIRY_DAYS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'expiryDays',
      label: 'Expiry days',
      description: 'Days a new Followup of this type stays Pending.',
      icon: 'IconClock',
    },
    {
      universalIdentifier:
        FOLLOWUP_TYPE_COMMISSIONABLE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.BOOLEAN,
      name: 'commissionable',
      label: 'Commissionable',
      description: 'Whether purchases during this Followup earn Commission.',
      icon: 'IconCoin',
      defaultValue: false,
    },
  ],
});
