import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  OPT_OUT_OBJECT_UNIVERSAL_IDENTIFIER,
  OPT_PHONE_UNIVERSAL_IDENTIFIER,
  OPT_REASON_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: OPT_OUT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'smsOptOut',
  namePlural: 'smsOptOuts',
  labelSingular: 'SMS Opt-out',
  labelPlural: 'SMS Opt-outs',
  description: 'Phone numbers that must never receive an SMS.',
  icon: 'IconMessageOff',
  labelIdentifierFieldMetadataUniversalIdentifier:
    OPT_PHONE_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: OPT_PHONE_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'phone',
      label: 'Phone',
      description: 'E.164, for example +441234567890.',
      icon: 'IconPhone',
      isUnique: true,
    },
    {
      universalIdentifier: OPT_REASON_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'reason',
      label: 'Reason',
      icon: 'IconNotes',
      isNullable: true,
    },
  ],
});
