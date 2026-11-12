import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_SLOT2_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  'd651adfc-ecef-469b-925b-8a4571638ecf';

export default defineField({
  universalIdentifier: OPPORTUNITY_SLOT2_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'slot2Status',
  label: 'Slot 2 status',
  icon: 'IconListNumbers',
  defaultValue: "'PENDING'",
  options: [
    {
      id: 'eae374a5-e3db-42df-bb57-addbc614d76e',
      value: 'PENDING',
      label: 'در انتظار',
      position: 0,
      color: 'gray',
    },
    {
      id: '736fc99b-c7bf-4cfa-8e1e-a924cd1de394',
      value: 'DONE',
      label: 'انجام‌شده',
      position: 1,
      color: 'green',
    },
    {
      id: '9929a5b2-7d49-411a-a34a-1808a963a70e',
      value: 'MISSED',
      label: 'انجام‌نشده',
      position: 2,
      color: 'red',
    },
    {
      id: 'b3b56d86-c394-4842-b1d1-8a68915473ed',
      value: 'MOVED',
      label: 'جابه‌جاشده',
      position: 3,
      color: 'orange',
    },
  ],
});
