import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  TRADER_ON_TRADING_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: TRADING_ACCOUNTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'tradingAccounts',
  label: 'Trading Accounts',
  description: 'Trading Accounts this Trader owns.',
  icon: 'IconChartCandle',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier:
    TRADING_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    TRADER_ON_TRADING_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
