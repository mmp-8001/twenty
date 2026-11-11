import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_OPEN_DEAL_KEY_FIELD_UNIVERSAL_IDENTIFIER =
  '1b929cb0-fadf-486e-ada0-2c7cb0d4c19f';

export default defineField({
  universalIdentifier: OPPORTUNITY_OPEN_DEAL_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.TEXT,
  name: 'openDealKey',
  label: 'Open deal key',
  icon: 'IconKey',
  isNullable: true,
  isUnique: true,
});
