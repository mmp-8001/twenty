import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_REGISTRATION_SOURCE_FIELD_UNIVERSAL_IDENTIFIER =
  '6a5af537-7cea-4d0c-bc14-2eb7ea0a4a46';

export default defineField({
  universalIdentifier: PERSON_REGISTRATION_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'registrationSource',
  label: 'Registration source',
  icon: 'IconRouteAltRight',
  isNullable: true,
  options: [
    {
      id: 'be9fd151-cc79-48ea-af0c-f899d0b804e3',
      value: 'WEBSITE',
      label: 'وب‌سایت',
      position: 0,
      color: 'blue',
    },
    {
      id: 'eda62ac0-9140-4aeb-98e0-a579f860bba4',
      value: 'TELEGRAM',
      label: 'تلگرام',
      position: 1,
      color: 'sky',
    },
    {
      id: 'a6e9dd80-2a99-402c-8f76-b52e5fbdef66',
      value: 'ZOOMIT',
      label: 'زومیت',
      position: 2,
      color: 'purple',
    },
  ],
});
