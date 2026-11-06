import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CHALLENGE_ACCOUNT_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  CHALLENGE_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  CHALLENGE_ACCOUNT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
  CHALLENGE_ACCOUNT_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
  CHALLENGE_ACCOUNT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  CHALLENGE_ACCOUNTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  USER_ON_CHALLENGE_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: CHALLENGE_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'challengeAccount',
  namePlural: 'challengeAccounts',
  labelSingular: 'Challenge Account',
  labelPlural: 'Challenge Accounts',
  description: "A User's challenge account, synced read-only from proopco.",
  icon: 'IconChartCandle',
  disabledObjectPermissionActions: [
    'canUpdateObjectRecords',
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  isUICreatable: false,
  isUIEditable: false,
  labelIdentifierFieldMetadataUniversalIdentifier:
    CHALLENGE_ACCOUNT_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier:
        CHALLENGE_ACCOUNT_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'proopcoId',
      label: 'Proopco ID',
      description: 'Identifier assigned by proopco.',
      icon: 'IconHash',
      isUnique: true,
    },
    {
      universalIdentifier: CHALLENGE_ACCOUNT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'status',
      label: 'Status',
      description: 'Account status, as proopco reports it.',
      icon: 'IconActivity',
      isNullable: true,
    },
    {
      universalIdentifier:
        CHALLENGE_ACCOUNT_FAILURE_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'failureReason',
      label: 'Failure reason',
      description: 'Why the account failed, as proopco reports it.',
      icon: 'IconAlertTriangle',
      isNullable: true,
    },
    {
      universalIdentifier: CHALLENGE_ACCOUNT_PHASE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'phase',
      label: 'Phase',
      description: 'Challenge phase, as proopco reports it.',
      icon: 'IconStairs',
      isNullable: true,
    },
    {
      universalIdentifier:
        USER_ON_CHALLENGE_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'person',
      label: 'User',
      description: 'User who owns this account.',
      icon: 'IconUser',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
      relationTargetFieldMetadataUniversalIdentifier:
        CHALLENGE_ACCOUNTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'personId',
      },
    },
  ],
});
