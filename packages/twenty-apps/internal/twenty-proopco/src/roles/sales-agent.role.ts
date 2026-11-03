import {
  defineRole,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
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
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    {
      objectUniversalIdentifier: personObjectUniversalIdentifier,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier: TRADING_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
      ...readOnly,
    },
    {
      objectUniversalIdentifier: PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      ...readOnly,
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
