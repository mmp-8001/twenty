import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  CODE_ACTIVATION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  CODE_ACTIVATION_ACTIVATION_KEY_FIELD_UNIVERSAL_IDENTIFIER,
  CODE_ACTIVATION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  CODE_ACTIVATION_SMS_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  CODE_ACTIVATION_ACTIVATED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  CODE_ACTIVATION_USED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  CODE_ACTIVATION_LAST_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'codeActivation',
  namePlural: 'codeActivations',
  labelSingular: 'Code activation',
  labelPlural: 'Code activations',
  description: 'A code activated for one contact; never deleted, one per code and contact',
  icon: 'IconTicket',
  labelIdentifierFieldMetadataUniversalIdentifier:
    CODE_ACTIVATION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: CODE_ACTIVATION_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
      defaultValue: "''",
    },
    {
      universalIdentifier: CODE_ACTIVATION_ACTIVATION_KEY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'activationKey',
      label: 'Activation key',
      icon: 'IconKey',
      isUnique: true,
    },
    {
      universalIdentifier: CODE_ACTIVATION_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: "'PENDING'",
      options: [
        { id: 'dad3382a-d3f1-4cc3-b8ce-562dd211b609', value: 'PENDING', label: 'در انتظار', position: 0, color: 'blue' },
        { id: '5a0c2117-49fa-4397-8686-5576ea27fa6b', value: 'ACTIVE', label: 'فعال', position: 1, color: 'green' },
        { id: '063a9e9a-4b38-4b3f-8795-b7d3faf50f80', value: 'FAILED', label: 'ناموفق', position: 2, color: 'red' },
        { id: 'd8150527-80d6-4bd4-951c-3675eed2977a', value: 'USED', label: 'استفاده‌شده', position: 3, color: 'purple' },
        { id: 'e339d470-f36d-4b19-ab2d-4e18d8005f6b', value: 'DEACTIVATED', label: 'غیرفعال‌شده', position: 4, color: 'gray' },
      ],
    },
    {
      universalIdentifier: CODE_ACTIVATION_SMS_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'smsStatus',
      label: 'SMS status',
      icon: 'IconMessage',
      defaultValue: "'NOT_SENT'",
      options: [
        { id: 'cb85b5cb-54ce-4375-8924-6c822d6bcedc', value: 'NOT_SENT', label: 'ارسال‌نشده', position: 0, color: 'gray' },
        { id: 'abbe23c8-305c-4e8e-b748-3e05179716c6', value: 'SENT', label: 'ارسال‌شده', position: 1, color: 'green' },
        { id: '670a1153-1082-4740-b713-7a4b79ca9688', value: 'FAILED', label: 'ناموفق', position: 2, color: 'red' },
      ],
    },
    {
      universalIdentifier: CODE_ACTIVATION_ACTIVATED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'activatedAt',
      label: 'Activated at',
      icon: 'IconCheck',
      isNullable: true,
    },
    {
      universalIdentifier: CODE_ACTIVATION_USED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'usedAt',
      label: 'Used at',
      icon: 'IconShoppingCart',
      isNullable: true,
    },
    {
      universalIdentifier: CODE_ACTIVATION_LAST_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'lastError',
      label: 'Last error',
      icon: 'IconAlertTriangle',
      isNullable: true,
    },
  ],
});
