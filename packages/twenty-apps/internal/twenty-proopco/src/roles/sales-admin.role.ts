import { defineRole } from 'twenty-sdk/define';

import { SALES_ADMIN_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  SYNCED_DATA_OBJECT_PERMISSIONS,
  SYNCED_PERSON_FIELD_PERMISSIONS,
} from 'src/utils/synced-data-permissions';

export default defineRole({
  universalIdentifier: SALES_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Sales Admin',
  description: 'Works Users from the segments assigned to them. Reads synced data but cannot change it.',
  icon: 'IconHeadset',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: SYNCED_DATA_OBJECT_PERMISSIONS,
  fieldPermissions: SYNCED_PERSON_FIELD_PERMISSIONS,
});
