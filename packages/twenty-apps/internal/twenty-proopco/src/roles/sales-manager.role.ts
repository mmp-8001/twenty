import { defineRole } from 'twenty-sdk/define';

import { SALES_MANAGER_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineRole({
  universalIdentifier: SALES_MANAGER_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Sales Manager',
  description:
    'Supervises agents, edits Commission Tiers and Followup Types, marks Monthly Incomes Paid.',
  icon: 'IconUserStar',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: true,
  canSoftDeleteAllObjectRecords: true,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
});
