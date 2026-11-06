import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { WORKSPACE_MEMBER_CRM_STATUS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: WORKSPACE_MEMBER_CRM_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.SELECT,
  name: 'crmStatus',
  label: 'CRM status',
  description: 'Whether the admin is working, frozen or deactivated.',
  icon: 'IconUserCheck',
  defaultValue: "'ACTIVE'",
  isUIEditable: false,
  options: [
    {
      id: 'fe0e93cf-6cc4-4315-bd20-59613fd3beae',
      value: 'ACTIVE',
      label: 'Active',
      position: 0,
      color: 'green',
    },
    {
      id: '18fc853b-b9fe-43b0-9335-22cf1f393241',
      value: 'FROZEN',
      label: 'Frozen',
      position: 1,
      color: 'blue',
    },
    {
      id: '71244de7-eb60-4b37-b412-2fa2008370b4',
      value: 'DEACTIVATED',
      label: 'Deactivated',
      position: 2,
      color: 'gray',
    },
  ],
});
