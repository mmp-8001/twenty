import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_SLOT3_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  '4101a325-1e39-45c3-8b17-462c2d8cbb05';

export default defineField({
  universalIdentifier: OPPORTUNITY_SLOT3_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'slot3Status',
  label: 'Slot 3 status',
  icon: 'IconListNumbers',
  defaultValue: "'PENDING'",
  options: [
    {
      id: '0c84bc75-373e-49c8-adef-01d2efd4d6b7',
      value: 'PENDING',
      label: 'در انتظار',
      position: 0,
      color: 'gray',
    },
    {
      id: 'c6e0b81f-a36d-41f9-817f-9143a6c3a969',
      value: 'DONE',
      label: 'انجام‌شده',
      position: 1,
      color: 'green',
    },
    {
      id: '7df72cbc-a35b-4403-af04-c77318635b67',
      value: 'MISSED',
      label: 'انجام‌نشده',
      position: 2,
      color: 'red',
    },
    {
      id: '7c1c63cd-36aa-4c3d-9127-93625e142f59',
      value: 'MOVED',
      label: 'جابه‌جاشده',
      position: 3,
      color: 'orange',
    },
  ],
});
