import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_DEAL_TYPE_FIELD_UNIVERSAL_IDENTIFIER =
  '4e599abd-fdc3-4406-b235-96bb2c0ecc48';

export default defineField({
  universalIdentifier: OPPORTUNITY_DEAL_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'dealType',
  label: 'Deal type',
  icon: 'IconTag',
  defaultValue: "'CAMPAIGN'",
  options: [
    {
      id: '1b5d8077-01c5-4548-85ff-1663b08c0318',
      value: 'CAMPAIGN',
      label: 'کمپین',
      position: 0,
      color: 'blue',
    },
    {
      id: '5b1b4cc3-f148-4178-b469-960f370965d3',
      value: 'REBUY',
      label: 'خرید مجدد',
      position: 1,
      color: 'purple',
    },
  ],
});
