import {
  defineRole,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  SystemPermissionFlag,
} from 'twenty-sdk/define';

import {
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  PERSON_ELIGIBLE_PREDICATE_UNIVERSAL_IDENTIFIER,
  PERSON_OWNER_PREDICATE_UNIVERSAL_IDENTIFIER,
  PERSON_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
  SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  SETTINGS_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { PERSON_ELIGIBLE_MEMBER_IDS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-eligible-member-ids.field';
import { PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-owner-member.field';
import { READ_ONLY_GRANT } from 'src/roles/role-grants.util';

const { person, workspaceMember } = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS;

// Objects the Agent reads outright; Person is scoped by the row rule below.
const READABLE_OBJECT_UNIVERSAL_IDENTIFIERS = [
  person.universalIdentifier,
  workspaceMember.universalIdentifier,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_SEGMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  SETTINGS_OBJECT_UNIVERSAL_IDENTIFIER,
];

export default defineRole({
  universalIdentifier: AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Agent',
  description:
    'Works the contacts of their campaigns. Sees only owned and eligible contacts.',
  icon: 'IconHeadset',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToUsers: true,
  canBeAssignedToAgents: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: READABLE_OBJECT_UNIVERSAL_IDENTIFIERS.map(
    (objectUniversalIdentifier) => ({
      objectUniversalIdentifier,
      ...READ_ONLY_GRANT,
    }),
  ),
  fieldPermissions: [],
  permissionFlagUniversalIdentifiers: [
    SystemPermissionFlag.PROFILE_INFORMATION,
  ],
  rowLevelPermissionPredicateGroups: [
    {
      universalIdentifier: PERSON_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: person.universalIdentifier,
      logicalOperator: 'OR',
    },
  ],
  // The owner side binds ownerMember (a WorkspaceMember): row rules compare a member, not an Agent.
  rowLevelPermissionPredicates: [
    {
      universalIdentifier: PERSON_OWNER_PREDICATE_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: person.universalIdentifier,
      fieldUniversalIdentifier: PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'IS',
      workspaceMemberFieldUniversalIdentifier:
        workspaceMember.fields.id.universalIdentifier,
      predicateGroupUniversalIdentifier:
        PERSON_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
    },
    {
      universalIdentifier: PERSON_ELIGIBLE_PREDICATE_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: person.universalIdentifier,
      fieldUniversalIdentifier:
        PERSON_ELIGIBLE_MEMBER_IDS_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'CONTAINS',
      workspaceMemberFieldUniversalIdentifier:
        workspaceMember.fields.id.universalIdentifier,
      predicateGroupUniversalIdentifier:
        PERSON_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
    },
  ],
});
