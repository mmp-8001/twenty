import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  CAMPAIGN_MESSAGE_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_RECIPIENT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_SEGMENT_VIEW_ID_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_SENT_AT_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'campaign',
  namePlural: 'campaigns',
  labelSingular: 'Campaign',
  labelPlural: 'Campaigns',
  description: 'An SMS sent to every Trader matching a Segment.',
  icon: 'IconSpeakerphone',
  labelIdentifierFieldMetadataUniversalIdentifier:
    CAMPAIGN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: CAMPAIGN_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconTag',
    },
    {
      universalIdentifier: CAMPAIGN_SEGMENT_VIEW_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'segmentViewId',
      label: 'Segment view id',
      description: 'Id of the saved View on People whose filters pick the recipients.',
      icon: 'IconFilter',
    },
    {
      universalIdentifier: CAMPAIGN_MESSAGE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'message',
      label: 'Message',
      icon: 'IconMessage',
    },
    {
      universalIdentifier: CAMPAIGN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgress',
      defaultValue: "'DRAFT'",
      options: [
        { id: '5d1a8c2e-7b3f-4e90-a1c4-2f6b8d0e1a01', value: 'DRAFT', label: 'Draft', position: 0, color: 'gray' },
        { id: '5d1a8c2e-7b3f-4e90-a1c4-2f6b8d0e1a02', value: 'SENDING', label: 'Sending', position: 1, color: 'orange' },
        { id: '5d1a8c2e-7b3f-4e90-a1c4-2f6b8d0e1a03', value: 'SENT', label: 'Sent', position: 2, color: 'green' },
      ],
    },
    {
      universalIdentifier: CAMPAIGN_SENT_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'sentAt',
      label: 'Sent at',
      icon: 'IconSend',
      isNullable: true,
      isUIEditable: false,
    },
    {
      universalIdentifier: CAMPAIGN_RECIPIENT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'recipientCount',
      label: 'Recipients',
      icon: 'IconUsers',
      isNullable: true,
      isUIEditable: false,
    },
  ],
});
