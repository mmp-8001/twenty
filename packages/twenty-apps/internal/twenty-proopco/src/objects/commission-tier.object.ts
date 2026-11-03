import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  COMMISSION_TIER_MAX_DAY_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_TIER_MIN_DAY_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_TIER_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  COMMISSION_TIER_OBJECT_UNIVERSAL_IDENTIFIER,
  COMMISSION_TIER_RATE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: COMMISSION_TIER_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'commissionTier',
  namePlural: 'commissionTiers',
  labelSingular: 'Commission Tier',
  labelPlural: 'Commission Tiers',
  description: 'Commission rate for purchases made within a range of days.',
  icon: 'IconPercentage',
  labelIdentifierFieldMetadataUniversalIdentifier:
    COMMISSION_TIER_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: COMMISSION_TIER_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconTag',
    },
    {
      universalIdentifier: COMMISSION_TIER_MIN_DAY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'minDay',
      label: 'Min day',
      description: 'First day since the Followup was created, inclusive.',
      icon: 'IconCalendarPlus',
    },
    {
      universalIdentifier: COMMISSION_TIER_MAX_DAY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'maxDay',
      label: 'Max day',
      description: 'Last day since the Followup was created, inclusive.',
      icon: 'IconCalendarMinus',
    },
    {
      universalIdentifier: COMMISSION_TIER_RATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'rate',
      label: 'Rate',
      description: 'Fraction of the base paid as Commission, e.g. 0.05.',
      icon: 'IconPercentage',
    },
  ],
});
