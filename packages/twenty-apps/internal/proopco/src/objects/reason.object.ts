import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  REASON_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
  REASON_KIND_FIELD_UNIVERSAL_IDENTIFIER,
  REASON_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  REASON_REQUIRES_TEXT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'reason',
  namePlural: 'reasons',
  labelSingular: 'Reason',
  labelPlural: 'Reasons',
  description: 'Why a contact is satisfied, dissatisfied or asked not to be called',
  icon: 'IconMoodSmile',
  labelIdentifierFieldMetadataUniversalIdentifier:
    REASON_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: REASON_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
      defaultValue: "''",
    },
    {
      universalIdentifier: REASON_KIND_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'kind',
      label: 'Kind',
      icon: 'IconCategory',
      defaultValue: "'SATISFACTION'",
      options: [
        { id: 'aad55c74-8187-48d7-916e-a547323a9753', value: 'SATISFACTION', label: 'رضایت', position: 0, color: 'green' },
        { id: 'dd8b17bf-b8f1-4708-83ec-e3354d3cc9ca', value: 'DISSATISFACTION', label: 'نارضایتی', position: 1, color: 'orange' },
        { id: 'eca322c2-29f5-4db0-8b09-3b04e74b8319', value: 'DO_NOT_CONTACT', label: 'عدم تماس', position: 2, color: 'red' },
      ],
    },
    {
      universalIdentifier: REASON_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.BOOLEAN,
      name: 'isActive',
      label: 'Is active',
      icon: 'IconCheck',
      defaultValue: true,
    },
    {
      universalIdentifier: REASON_REQUIRES_TEXT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.BOOLEAN,
      name: 'requiresText',
      label: 'Requires text',
      icon: 'IconTextCaption',
      defaultValue: false,
    },
  ],
});
