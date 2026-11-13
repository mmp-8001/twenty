import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_CLOSE_REASON_FIELD_UNIVERSAL_IDENTIFIER =
  '71394cdf-7eed-4344-a92a-681541c36097';

export default defineField({
  universalIdentifier: OPPORTUNITY_CLOSE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'closeReason',
  label: 'Close reason',
  icon: 'IconFlag',
  options: [
    {
      id: 'ff83ac80-6a7a-413e-9893-fdc71dd0abe3',
      value: 'EXPIRED',
      label: 'منقضی',
      position: 0,
      color: 'gray',
    },
    {
      id: '4dbc2565-1fad-4036-ae10-48bd1a800d6f',
      value: 'UNANSWERED_AT_FIRST_CALL',
      label: 'بی‌پاسخ در اولین تماس',
      position: 1,
      color: 'orange',
    },
    {
      id: '5f4e02ee-3c24-444b-828e-d1d5e30961f5',
      value: 'ABANDONED_IN_72H',
      label: 'رهاشده در ۷۲ ساعت',
      position: 2,
      color: 'orange',
    },
    {
      id: 'a62ad333-684f-46c1-b49d-86f7e25c9e5d',
      value: 'DO_NOT_CONTACT',
      label: 'عدم تماس',
      position: 3,
      color: 'red',
    },
    {
      id: '7ba34594-3f85-4580-b697-e20e172b59cf',
      value: 'TRANSFERRED',
      label: 'منتقل‌شده',
      position: 4,
      color: 'gray',
    },
    {
      id: '4914b1be-71a4-45b1-8373-d4e5ae5ac1a8',
      value: 'RELEASED',
      label: 'آزادشده',
      position: 5,
      color: 'gray',
    },
    {
      id: 'f371276d-9af6-4378-ad62-f840dbd30050',
      value: 'PURCHASED_BEFORE_CALL',
      label: 'خرید پیش از تماس',
      position: 6,
      color: 'green',
    },
  ],
  isNullable: true,
});
