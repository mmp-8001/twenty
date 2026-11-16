import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  CALL_REASON_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  CALL_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: CALL_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'callReason',
  namePlural: 'callReasons',
  labelSingular: 'Call reason',
  labelPlural: 'Call reasons',
  description: 'Links a reason to a call',
  icon: 'IconMoodSmile',
  labelIdentifierFieldMetadataUniversalIdentifier:
    CALL_REASON_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: CALL_REASON_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
      defaultValue: "''",
    },
  ],
});
