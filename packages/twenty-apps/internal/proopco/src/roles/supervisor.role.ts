import { defineRole, SystemPermissionFlag } from 'twenty-sdk/define';

import {
  CAMPAIGN_AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  PURCHASE_COMMISSION_USDT_FIELD_UNIVERSAL_IDENTIFIER,
  PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
  PLATFORM_EVENT_INBOX_OBJECT_UNIVERSAL_IDENTIFIER,
  SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  SEGMENT_VALIDATION_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  hiddenField,
  NO_ACCESS_GRANT,
  readOnlyField,
  READ_WRITE_GRANT,
  READ_WRITE_SOFT_DELETE_GRANT,
} from 'src/roles/role-grants.util';

export default defineRole({
  universalIdentifier: SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Supervisor',
  description: 'Builds segments and campaigns. Reads every contact.',
  icon: 'IconUserShield',
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
      objectUniversalIdentifier: CAMPAIGN_CODE_OBJECT_UNIVERSAL_IDENTIFIER,
      ...READ_WRITE_SOFT_DELETE_GRANT,
    },
    {
      objectUniversalIdentifier: MONTHLY_INCOME_OBJECT_UNIVERSAL_IDENTIFIER,
      ...NO_ACCESS_GRANT,
    },
    {
      objectUniversalIdentifier:
        PLATFORM_EVENT_INBOX_OBJECT_UNIVERSAL_IDENTIFIER,
      ...NO_ACCESS_GRANT,
    },
  ],
  fieldPermissions: [
    hiddenField(
      PURCHASE_OBJECT_UNIVERSAL_IDENTIFIER,
      PURCHASE_COMMISSION_USDT_FIELD_UNIVERSAL_IDENTIFIER,
    ),
    readOnlyField(
      CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
      CAMPAIGN_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
    ),
    readOnlyField(
      SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
      SEGMENT_VALIDATION_ERROR_FIELD_UNIVERSAL_IDENTIFIER,
    ),
  ],
  permissionFlagUniversalIdentifiers: [
    SystemPermissionFlag.PROFILE_INFORMATION,
    SystemPermissionFlag.VIEWS,
  ],
});
