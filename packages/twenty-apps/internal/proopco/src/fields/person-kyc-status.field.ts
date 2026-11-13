import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_KYC_STATUS_FIELD_UNIVERSAL_IDENTIFIER =
  'da9b6d3e-3fae-47e5-97bf-8e76c0ca3902';

export default defineField({
  universalIdentifier: PERSON_KYC_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'kycStatus',
  label: 'KYC status',
  icon: 'IconIdBadge2',
  isNullable: true,
  options: [
    {
      id: '28c8f231-9188-487b-b055-ddb72515bb61',
      value: 'NONE',
      label: 'هیچ',
      position: 0,
      color: 'gray',
    },
    {
      id: 'e87569ed-4a81-45e2-859a-080402824bd4',
      value: 'PENDING',
      label: 'در انتظار',
      position: 1,
      color: 'orange',
    },
    {
      id: 'd6f09b6d-1e43-4544-acb6-77b0cc563eb4',
      value: 'CONFIRMED',
      label: 'تأییدشده',
      position: 2,
      color: 'green',
    },
    {
      id: '9ea74b36-1037-40af-a9b8-2aab0a9cd826',
      value: 'REJECTED',
      label: 'ردشده',
      position: 3,
      color: 'red',
    },
  ],
});
