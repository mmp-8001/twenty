import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PERSON_ACTIVE_ACCOUNT_COUNT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: PERSON_ACTIVE_ACCOUNT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.NUMBER,
  name: 'activeAccountCount',
  label: 'Active account count',
  description: 'Number of active Challenge Accounts, synced from proopco.',
  icon: 'IconChartCandle',
  isNullable: true,
  isUIEditable: false,
});
