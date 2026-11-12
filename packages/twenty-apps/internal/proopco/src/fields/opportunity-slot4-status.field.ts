import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_SLOT4_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  '9fc0b891-2c03-4db6-b7bb-5ec4ae68c766';

export default defineField({
  universalIdentifier: OPPORTUNITY_SLOT4_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'slot4Status',
  label: 'Slot 4 status',
  icon: 'IconListNumbers',
  defaultValue: "'PENDING'",
  options: [
    {
      id: '007e36a3-0c2c-44cf-9992-037e23b1fefc',
      value: 'PENDING',
      label: 'در انتظار',
      position: 0,
      color: 'gray',
    },
    {
      id: '6e82174b-fe3b-4f78-9fc5-f063f93f1a1e',
      value: 'DONE',
      label: 'انجام‌شده',
      position: 1,
      color: 'green',
    },
    {
      id: 'b54e233c-444a-40a2-a6fa-eea9060a7a3c',
      value: 'MISSED',
      label: 'انجام‌نشده',
      position: 2,
      color: 'red',
    },
    {
      id: 'b07c7661-d855-4eda-a38d-5b512b565aea',
      value: 'MOVED',
      label: 'جابه‌جاشده',
      position: 3,
      color: 'orange',
    },
  ],
});
