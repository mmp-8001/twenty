import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_SLOT5_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  '8a7a58d4-e0c8-48b4-ae7d-78fd91c8f831';

export default defineField({
  universalIdentifier: OPPORTUNITY_SLOT5_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'slot5Status',
  label: 'Slot 5 status',
  icon: 'IconListNumbers',
  defaultValue: "'PENDING'",
  options: [
    {
      id: 'e98f7147-eb8e-4419-a709-a3f00555feee',
      value: 'PENDING',
      label: 'Pending',
      position: 0,
      color: 'gray',
    },
    {
      id: '2342b15d-5863-446b-bb4b-8061baffbe95',
      value: 'DONE',
      label: 'Done',
      position: 1,
      color: 'green',
    },
    {
      id: '5d695532-05c8-427d-a460-6095d5e82807',
      value: 'MISSED',
      label: 'Missed',
      position: 2,
      color: 'red',
    },
    {
      id: '22290cee-4dc5-46d5-b0b9-edaacafde13f',
      value: 'MOVED',
      label: 'Moved',
      position: 3,
      color: 'orange',
    },
  ],
});
