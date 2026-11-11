import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_FROZEN_MS_FIELD_UNIVERSAL_IDENTIFIER =
  '2d848e29-762d-4697-aa44-80c30c600dce';

export default defineField({
  universalIdentifier: OPPORTUNITY_FROZEN_MS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.NUMBER,
  name: 'frozenMs',
  label: 'Frozen (ms)',
  icon: 'IconSnowflake',
  defaultValue: 0,
});
