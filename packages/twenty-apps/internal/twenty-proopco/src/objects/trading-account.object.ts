import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  TRADER_ON_TRADING_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNT_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNT_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: TRADING_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'tradingAccount',
  namePlural: 'tradingAccounts',
  labelSingular: 'Trading Account',
  labelPlural: 'Trading Accounts',
  description: "A Trader's challenge account, synced read-only from proopco.",
  icon: 'IconChartCandle',
  disabledObjectPermissionActions: [
    'canUpdateObjectRecords',
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  isUICreatable: false,
  isUIEditable: false,
  labelIdentifierFieldMetadataUniversalIdentifier:
    TRADING_ACCOUNT_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier:
        TRADING_ACCOUNT_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'proopcoId',
      label: 'Proopco ID',
      description: 'Identifier assigned by proopco.',
      icon: 'IconHash',
      isUnique: true,
    },
    {
      universalIdentifier: TRADING_ACCOUNT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'status',
      label: 'Status',
      description: 'Account status, as proopco reports it.',
      icon: 'IconActivity',
      isNullable: true,
    },
    {
      universalIdentifier:
        TRADING_ACCOUNT_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'failureReason',
      label: 'Failure reason',
      description: 'Why the account failed, as proopco reports it.',
      icon: 'IconAlertTriangle',
      isNullable: true,
    },
    {
      universalIdentifier: TRADING_ACCOUNT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'phase',
      label: 'Phase',
      description: 'Challenge phase, as proopco reports it.',
      icon: 'IconStairs',
      isNullable: true,
    },
    {
      universalIdentifier: TRADER_ON_TRADING_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'trader',
      label: 'Trader',
      description: 'Trader who owns this account.',
      icon: 'IconUser',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        TRADING_ACCOUNTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'traderId',
      },
    },
  ],
});
