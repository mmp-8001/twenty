import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_SLOT1_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  '99c450c9-f698-4f05-851b-dd27bcb588ac';

export default defineField({
  universalIdentifier: OPPORTUNITY_SLOT1_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'slot1Status',
  label: 'Slot 1 status',
  icon: 'IconListNumbers',
  defaultValue: "'PENDING'",
  options: [
    {
      id: '8ed8621b-2f4f-4822-9dfb-10c06874ee60',
      value: 'PENDING',
      label: 'در انتظار',
      position: 0,
      color: 'gray',
    },
    {
      id: '3e8dccb4-09f6-45d7-85a4-a295fd77d93f',
      value: 'DONE',
      label: 'انجام‌شده',
      position: 1,
      color: 'green',
    },
    {
      id: '0be4cb37-2944-410f-bb3d-154f3155db41',
      value: 'MISSED',
      label: 'انجام‌نشده',
      position: 2,
      color: 'red',
    },
    {
      id: '2e0bb631-0150-4f54-8b6a-1008d795ba0e',
      value: 'MOVED',
      label: 'جابه‌جاشده',
      position: 3,
      color: 'orange',
    },
  ],
});
