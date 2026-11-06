import { defineRole } from 'twenty-sdk/define';

import { FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  CAMPAIGN_MANAGEMENT_OBJECT_PERMISSIONS,
  SYNCED_DATA_OBJECT_PERMISSIONS,
  SYNCED_PERSON_FIELD_PERMISSIONS,
} from 'src/utils/synced-data-permissions';

export default defineRole({
  universalIdentifier: FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Full Admin',
  description: 'Manages the CRM, roles and settings. Reads synced data but cannot change it.',
  icon: 'IconCrown',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: true,
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    ...SYNCED_DATA_OBJECT_PERMISSIONS,
    ...CAMPAIGN_MANAGEMENT_OBJECT_PERMISSIONS,
  ],
  fieldPermissions: SYNCED_PERSON_FIELD_PERMISSIONS,
});
