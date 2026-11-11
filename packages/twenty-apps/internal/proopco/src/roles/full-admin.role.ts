import { defineRole, SystemPermissionFlag } from 'twenty-sdk/define';

import {
  AGENT_FROZEN_SINCE_FIELD_UNIVERSAL_IDENTIFIER,
  AGENT_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_OWNED_CONTACT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  SEGMENT_VALIDATION_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
  SETTINGS_LAST_ROLLED_UP_JALALI_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
  REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  SETTINGS_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  readOnlyField,
  READ_WRITE_GRANT,
  READ_WRITE_SOFT_DELETE_GRANT,
} from 'src/roles/role-grants.util';

export default defineRole({
  universalIdentifier: FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Full Admin',
  description:
    'Owns configuration and people. Has no Agent, so cannot work calls.',
  icon: 'IconUserCog',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    {
      objectUniversalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
      ...READ_WRITE_GRANT,
    },
    {
      objectUniversalIdentifier: SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      ...READ_WRITE_GRANT,
    },
    {
      objectUniversalIdentifier: CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
      ...READ_WRITE_GRANT,
    },
    {
      objectUniversalIdentifier: CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      ...READ_WRITE_SOFT_DELETE_GRANT,
    },
    {
      objectUniversalIdentifier: CAMPAIGN_AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
      ...READ_WRITE_SOFT_DELETE_GRANT,
    },
    {
      objectUniversalIdentifier: SETTINGS_OBJECT_UNIVERSAL_IDENTIFIER,
      ...READ_WRITE_GRANT,
    },
    {
      objectUniversalIdentifier: REASON_OBJECT_UNIVERSAL_IDENTIFIER,
      ...READ_WRITE_GRANT,
    },
  ],
  fieldPermissions: [
    readOnlyField(
      AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
      AGENT_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
    ),
    readOnlyField(
      AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
      AGENT_FROZEN_SINCE_FIELD_UNIVERSAL_IDENTIFIER,
    ),
    readOnlyField(
      AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
      AGENT_OWNED_CONTACT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
    ),
    readOnlyField(
      CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
      CAMPAIGN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
    ),
    readOnlyField(
      SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      SEGMENT_VALIDATION_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
    ),
    readOnlyField(
      SETTINGS_OBJECT_UNIVERSAL_IDENTIFIER,
      SETTINGS_LAST_ROLLED_UP_JALALI_MONTH_FIELD_UNIVERSAL_IDENTIFIER,
    ),
  ],
  permissionFlagUniversalIdentifiers: [
    SystemPermissionFlag.PROFILE_INFORMATION,
    SystemPermissionFlag.VIEWS,
    SystemPermissionFlag.WORKSPACE_MEMBERS,
    SystemPermissionFlag.ROLES,
  ],
});
