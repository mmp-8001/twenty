import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  MSG_BODY_UNIVERSAL_IDENTIFIER,
  MSG_DELIVERED_AT_UNIVERSAL_IDENTIFIER,
  MSG_ERROR_UNIVERSAL_IDENTIFIER,
  MSG_PROVIDER_MESSAGE_ID_UNIVERSAL_IDENTIFIER,
  MSG_SENT_AT_UNIVERSAL_IDENTIFIER,
  MSG_SOURCE_REF_UNIVERSAL_IDENTIFIER,
  MSG_STATUS_UNIVERSAL_IDENTIFIER,
  MSG_TO_UNIVERSAL_IDENTIFIER,
  MESSAGE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const STATUS_OPTIONS = [
  ['QUEUED', 'Queued', 'blue', '3f0f9f0e-6f6b-4a64-8c55-2a4a1d7e0001'],
  ['SENT', 'Sent', 'turquoise', '3f0f9f0e-6f6b-4a64-8c55-2a4a1d7e0002'],
  ['DELIVERED', 'Delivered', 'green', '3f0f9f0e-6f6b-4a64-8c55-2a4a1d7e0003'],
  ['FAILED', 'Failed', 'red', '3f0f9f0e-6f6b-4a64-8c55-2a4a1d7e0004'],
  [
    'SKIPPED_OPT_OUT',
    'Skipped (opted out)',
    'orange',
    '3f0f9f0e-6f6b-4a64-8c55-2a4a1d7e0005',
  ],
  ['INVALID', 'Invalid', 'gray', '3f0f9f0e-6f6b-4a64-8c55-2a4a1d7e0006'],
] as const;

export default defineObject({
  universalIdentifier: MESSAGE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'smsMessage',
  namePlural: 'smsMessages',
  labelSingular: 'SMS Message',
  labelPlural: 'SMS Messages',
  description: 'One SMS: queued, sent and tracked until delivered.',
  icon: 'IconMessage',
  labelIdentifierFieldMetadataUniversalIdentifier: MSG_TO_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: MSG_TO_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'to',
      label: 'To',
      description: 'Recipient in E.164 form when valid.',
      icon: 'IconPhone',
    },
    {
      universalIdentifier: MSG_BODY_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'body',
      label: 'Body',
      icon: 'IconMessage',
    },
    {
      universalIdentifier: MSG_SOURCE_REF_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'sourceRef',
      label: 'Source ref',
      description:
        'Caller-chosen key; enqueuing the same key twice sends once.',
      icon: 'IconKey',
      isUnique: true,
      isNullable: true,
    },
    {
      universalIdentifier: MSG_STATUS_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: "'QUEUED'",
      options: STATUS_OPTIONS.map(([value, label, color, id], position) => ({
        id,
        value,
        label,
        color,
        position,
      })),
    },
    {
      universalIdentifier: MSG_PROVIDER_MESSAGE_ID_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'providerMessageId',
      label: 'Provider message id',
      icon: 'IconHash',
      isNullable: true,
    },
    {
      universalIdentifier: MSG_ERROR_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'error',
      label: 'Error',
      description: "The provider's error for a failed send.",
      icon: 'IconAlertCircle',
      isNullable: true,
    },
    {
      universalIdentifier: MSG_SENT_AT_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'sentAt',
      label: 'Sent at',
      icon: 'IconSend',
      isNullable: true,
    },
    {
      universalIdentifier: MSG_DELIVERED_AT_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'deliveredAt',
      label: 'Delivered at',
      icon: 'IconChecks',
      isNullable: true,
    },
  ],
});
