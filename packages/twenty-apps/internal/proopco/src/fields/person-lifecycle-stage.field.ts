import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_LIFECYCLE_STAGE_FIELD_UNIVERSAL_IDENTIFIER =
  '6b28e49c-1772-4dda-92b5-ca9137e9cdff';

export default defineField({
  universalIdentifier: PERSON_LIFECYCLE_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'lifecycleStage',
  label: 'Lifecycle stage',
  icon: 'IconRoute',
  defaultValue: "'FREE'",
  options: [
    {
      id: 'f6d446bf-0666-4426-a316-2a7d7780aaba',
      value: 'FREE',
      label: 'آزاد',
      position: 0,
      color: 'green',
    },
    {
      id: '4dadef42-7908-4641-9e7e-f2705a22c7fd',
      value: 'AWAITING_FIRST_CALL',
      label: 'در انتظار اولین تماس',
      position: 1,
      color: 'blue',
    },
    {
      id: 'c031a41b-f364-420e-a332-5ca03778edd7',
      value: 'IN_FOLLOW_UP',
      label: 'در حال پیگیری',
      position: 2,
      color: 'turquoise',
    },
    {
      id: '5339be97-0745-49c4-b62d-afe1ef73d0e9',
      value: 'CUSTOMER',
      label: 'مشتری',
      position: 3,
      color: 'purple',
    },
    {
      id: '31c7b5aa-95de-41c4-a181-78e51bc86df5',
      value: 'REBUY_WINDOW',
      label: 'فرصت خرید مجدد',
      position: 4,
      color: 'orange',
    },
    {
      id: 'e3a469d8-c973-48fc-9332-ff9bba86914d',
      value: 'COOL_DOWN',
      label: 'دوره استراحت',
      position: 5,
      color: 'sky',
    },
    {
      id: 'b0a44b52-3ec4-4820-8402-2b182680d1d5',
      value: 'DO_NOT_CONTACT',
      label: 'عدم تماس',
      position: 6,
      color: 'red',
    },
  ],
});
