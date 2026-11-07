import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { WORKSPACE_MEMBER_FROZEN_SINCE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_FROZEN_SINCE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.DATE_TIME,
  name: 'frozenSince',
  label: 'Frozen since',
  description: 'When the agent was frozen. Empty unless frozen.',
  icon: 'IconSnowflake',
  isNullable: true,
  isUIEditable: false,
});
