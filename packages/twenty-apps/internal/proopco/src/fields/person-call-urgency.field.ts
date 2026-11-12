import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_CALL_URGENCY_FIELD_UNIVERSAL_IDENTIFIER =
  '1b2dcb23-ddf7-42a5-962f-c789e8ea61fd';

export default defineField({
  universalIdentifier: PERSON_CALL_URGENCY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'callUrgency',
  label: 'Call urgency',
  icon: 'IconAlertTriangle',
  options: [
    {
      id: 'd0809863-ebbb-4a69-a866-a7a1979feb91',
      value: 'LATER',
      label: 'بعداً',
      position: 0,
      color: 'gray',
    },
    {
      id: '3aa2a579-e408-4f7f-91b2-999e6b459388',
      value: 'TODAY',
      label: 'امروز',
      position: 1,
      color: 'blue',
    },
    {
      id: 'e1a4e5d9-aebe-4a7e-a9e0-64282efe8537',
      value: 'DUE',
      label: 'موعد تماس',
      position: 2,
      color: 'orange',
    },
    {
      id: '835c5176-8a9d-420f-b9cd-baed588f50cb',
      value: 'OVERDUE',
      label: 'دیرکرد',
      position: 3,
      color: 'red',
    },
  ],
  isNullable: true,
});
