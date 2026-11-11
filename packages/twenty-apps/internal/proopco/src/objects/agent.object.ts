import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  AGENT_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
  AGENT_FROZEN_SINCE_FIELD_UNIVERSAL_IDENTIFIER,
  AGENT_OWNED_CONTACT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'agent',
  namePlural: 'agents',
  labelSingular: 'Agent',
  labelPlural: 'Agents',
  description: 'A person who works contacts through the CRM',
  icon: 'IconHeadset',
  labelIdentifierFieldMetadataUniversalIdentifier:
    AGENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: AGENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      icon: 'IconAbc',
      defaultValue: "''",
    },
    {
      universalIdentifier: AGENT_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.BOOLEAN,
      name: 'isActive',
      label: 'Is active',
      icon: 'IconCheck',
      defaultValue: true,
    },
    {
      universalIdentifier: AGENT_FROZEN_SINCE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'frozenSince',
      label: 'Frozen since',
      icon: 'IconSnowflake',
      isNullable: true,
    },
    {
      universalIdentifier: AGENT_OWNED_CONTACT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'ownedContactCount',
      label: 'Owned contacts count',
      icon: 'IconUsers',
      defaultValue: 0,
    },
  ],
});
