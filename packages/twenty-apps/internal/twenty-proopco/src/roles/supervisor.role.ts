import { defineRole } from 'twenty-sdk/define';

import { SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  CAMPAIGN_MANAGEMENT_OBJECT_PERMISSIONS,
  CAMPAIGN_OFFER_LINK_OBJECT_PERMISSIONS,
  SYNCED_DATA_OBJECT_PERMISSIONS,
  SYNCED_PERSON_FIELD_PERMISSIONS,
} from 'src/utils/synced-data-permissions';

export default defineRole({
  universalIdentifier: SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Supervisor',
  description: 'Supervises Sales Agents and assigns segments. Reads synced data but cannot change it.',
  icon: 'IconUserStar',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    ...SYNCED_DATA_OBJECT_PERMISSIONS,
    ...CAMPAIGN_MANAGEMENT_OBJECT_PERMISSIONS,
    ...CAMPAIGN_OFFER_LINK_OBJECT_PERMISSIONS,
  ],
  fieldPermissions: SYNCED_PERSON_FIELD_PERMISSIONS,
});
