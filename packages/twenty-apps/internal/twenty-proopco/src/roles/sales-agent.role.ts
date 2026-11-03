import {
  defineRole,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
  COMMISSION_TIER_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
  OWNER_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
  OWNER_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
  PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  PERSON_IS_VIP_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_LABELS_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_LAST_PURCHASE_AT_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_PURCHASE_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_TOTAL_SPENT_FIELD_UNIVERSAL_IDENTIFIER,
  REFERRED_BY_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  SALES_AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const personObjectUniversalIdentifier =
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier;

const workspaceMember = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember;
const task = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task;
const note = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note;

const readAndUpdate = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: true,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

const readOnly = {
  canReadObjectRecords: true,
  canUpdateObjectRecords: false,
  canSoftDeleteObjectRecords: false,
  canDestroyObjectRecords: false,
};

const SYNCED_PERSON_FIELD_UNIVERSAL_IDENTIFIERS = [
  PERSON_PROOPCO_ID_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_PURCHASE_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_TOTAL_SPENT_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_LAST_PURCHASE_AT_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_IS_VIP_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_LABELS_FIELD_UNIVERSAL_IDENTIFIER,
  REFERRED_BY_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
];

export default defineRole({
  universalIdentifier: SALES_AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Sales Agent',
  description:
    'Works Traders. Reads synced trading facts but cannot change them.',
  icon: 'IconHeadset',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: true,
  objectPermissions: [
    {
      objectUniversalIdentifier: personObjectUniversalIdentifier,
      ...readAndUpdate,
    },
    {
      objectUniversalIdentifier: TRADING_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
      ...readOnly,
    },
    {
      objectUniversalIdentifier: PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      ...readOnly,
    },
    ...[
      FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
      task.universalIdentifier,
      note.universalIdentifier,
    ].map((objectUniversalIdentifier) => ({
      objectUniversalIdentifier,
      ...readAndUpdate,
    })),
    ...[
      FOLLOWUP_TYPE_OBJECT_UNIVERSAL_IDENTIFIER,
      COMMISSION_TIER_OBJECT_UNIVERSAL_IDENTIFIER,
      COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
      MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
    ].map((objectUniversalIdentifier) => ({
      objectUniversalIdentifier,
      ...readOnly,
    })),
  ],
  rowLevelPermissionPredicateGroups: [
    {
      universalIdentifier: '5ade9edb-c759-429d-8d7e-1870d19b22cc',
      objectUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
      logicalOperator: 'OR',
    },
    {
      universalIdentifier: '7cd145f0-1204-47f9-86d2-5c4982bdbef1',
      objectUniversalIdentifier: task.universalIdentifier,
      logicalOperator: 'OR',
    },
  ],
  rowLevelPermissionPredicates: [
    {
      universalIdentifier: '5bc7bea4-f1b9-4238-bdc1-979d5cfc76d9',
      objectUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: OWNER_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'IS',
      workspaceMemberFieldUniversalIdentifier:
        workspaceMember.fields.id.universalIdentifier,
      predicateGroupUniversalIdentifier: '5ade9edb-c759-429d-8d7e-1870d19b22cc',
    },
    // An empty owner is the Pool, open to every agent.
    {
      universalIdentifier: '7b241d45-02c3-4512-a6e5-88da3981f907',
      objectUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: OWNER_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'IS_EMPTY',
      predicateGroupUniversalIdentifier: '5ade9edb-c759-429d-8d7e-1870d19b22cc',
    },
    {
      universalIdentifier: 'e7a875ac-8333-4194-bbb4-c56d9e0d3137',
      objectUniversalIdentifier: COMMISSION_OBJECT_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: OWNER_ON_COMMISSION_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'IS',
      workspaceMemberFieldUniversalIdentifier:
        workspaceMember.fields.id.universalIdentifier,
    },
    {
      universalIdentifier: '9ac6f6f6-7ef4-4e6a-881c-d30b5264cc15',
      objectUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier:
        AGENT_ON_MONTHLY_INCOME_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'IS',
      workspaceMemberFieldUniversalIdentifier:
        workspaceMember.fields.id.universalIdentifier,
    },
    {
      universalIdentifier: '26f7cfd7-a053-4c8a-bc22-670a9a7beb5b',
      objectUniversalIdentifier: task.universalIdentifier,
      fieldUniversalIdentifier: task.fields.assignee.universalIdentifier,
      operand: 'IS',
      workspaceMemberFieldUniversalIdentifier:
        workspaceMember.fields.id.universalIdentifier,
      predicateGroupUniversalIdentifier: '7cd145f0-1204-47f9-86d2-5c4982bdbef1',
    },
  ],
  fieldPermissions: SYNCED_PERSON_FIELD_UNIVERSAL_IDENTIFIERS.map(
    (fieldUniversalIdentifier) => ({
      objectUniversalIdentifier: personObjectUniversalIdentifier,
      fieldUniversalIdentifier,
      canReadFieldValue: true,
      canUpdateFieldValue: false,
    }),
  ),
});
