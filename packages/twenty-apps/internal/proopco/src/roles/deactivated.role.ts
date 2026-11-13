import { defineRole } from 'twenty-sdk/define';

import { DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Given by hand instead of removing a member, so history keeps its author.
export default defineRole({
  universalIdentifier: DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Deactivated',
  description: 'No access.',
  icon: 'IconUserOff',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [],
  fieldPermissions: [],
  permissionFlagUniversalIdentifiers: [],
});
