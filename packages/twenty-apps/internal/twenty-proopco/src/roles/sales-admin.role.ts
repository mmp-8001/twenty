import { defineRole, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';

import {
  CALL_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  CALL_OWN_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
  CALL_OWN_PREDICATE_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ADMIN_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OWN_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OWN_PREDICATE_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_OBJECT_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_OWN_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
  OWNERSHIP_OWN_PREDICATE_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ADMIN_OWN_PREDICATE_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ADMIN_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
  ADMIN_ON_CAMPAIGN_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_CURRENT_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_CURRENT_OWNER_PREDICATE_UNIVERSAL_IDENTIFIER,
  PERSON_VISIBILITY_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
  PERSON_VISIBLE_TO_MEMBER_IDS_FIELD_UNIVERSAL_IDENTIFIER,
  PERSON_VISIBLE_TO_MEMBER_PREDICATE_UNIVERSAL_IDENTIFIER,
  SALES_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  CAMPAIGN_READ_ONLY_OBJECT_PERMISSIONS,
  SYNCED_DATA_OBJECT_PERMISSIONS,
  SYNCED_PERSON_FIELD_PERMISSIONS,
} from 'src/utils/synced-data-permissions';

const { person, workspaceMember } = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS;

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
  objectPermissions: [
    ...SYNCED_DATA_OBJECT_PERMISSIONS,
    ...CAMPAIGN_READ_ONLY_OBJECT_PERMISSIONS,
  ],
  // OWN-08: a User outside the list and not owned does not exist for this role.
  rowLevelPermissionPredicateGroups: [
    {
      universalIdentifier: PERSON_VISIBILITY_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: person.universalIdentifier,
      logicalOperator: 'OR',
    },
    {
      universalIdentifier: CAMPAIGN_ADMIN_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: CAMPAIGN_ADMIN_OBJECT_UNIVERSAL_IDENTIFIER,
      logicalOperator: 'OR',
    },
    {
      universalIdentifier: OWNERSHIP_OWN_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: OWNERSHIP_OBJECT_UNIVERSAL_IDENTIFIER,
      logicalOperator: 'OR',
    },
    {
      universalIdentifier: FOLLOWUP_OWN_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
      logicalOperator: 'OR',
    },
    {
      universalIdentifier: CALL_OWN_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: CALL_OBJECT_UNIVERSAL_IDENTIFIER,
      logicalOperator: 'OR',
    },
  ],
  rowLevelPermissionPredicates: [
    {
      universalIdentifier: PERSON_VISIBLE_TO_MEMBER_PREDICATE_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: person.universalIdentifier,
      fieldUniversalIdentifier: PERSON_VISIBLE_TO_MEMBER_IDS_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'CONTAINS',
      workspaceMemberFieldUniversalIdentifier: workspaceMember.fields.id.universalIdentifier,
      predicateGroupUniversalIdentifier: PERSON_VISIBILITY_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
    },
    {
      universalIdentifier: PERSON_CURRENT_OWNER_PREDICATE_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: person.universalIdentifier,
      fieldUniversalIdentifier: PERSON_CURRENT_OWNER_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'IS',
      workspaceMemberFieldUniversalIdentifier: workspaceMember.fields.id.universalIdentifier,
      predicateGroupUniversalIdentifier: PERSON_VISIBILITY_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
    },
    {
      universalIdentifier: CAMPAIGN_ADMIN_OWN_PREDICATE_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: CAMPAIGN_ADMIN_OBJECT_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: ADMIN_ON_CAMPAIGN_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'IS',
      workspaceMemberFieldUniversalIdentifier: workspaceMember.fields.id.universalIdentifier,
      predicateGroupUniversalIdentifier: CAMPAIGN_ADMIN_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
    },
    {
      universalIdentifier: OWNERSHIP_OWN_PREDICATE_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: OWNERSHIP_OBJECT_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: OWNERSHIP_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'IS',
      workspaceMemberFieldUniversalIdentifier: workspaceMember.fields.id.universalIdentifier,
      predicateGroupUniversalIdentifier: OWNERSHIP_OWN_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
    },
    {
      universalIdentifier: FOLLOWUP_OWN_PREDICATE_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: FOLLOWUP_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'IS',
      workspaceMemberFieldUniversalIdentifier: workspaceMember.fields.id.universalIdentifier,
      predicateGroupUniversalIdentifier: FOLLOWUP_OWN_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
    },
    {
      universalIdentifier: CALL_OWN_PREDICATE_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: CALL_OBJECT_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: CALL_ADMIN_FIELD_UNIVERSAL_IDENTIFIER,
      operand: 'IS',
      workspaceMemberFieldUniversalIdentifier: workspaceMember.fields.id.universalIdentifier,
      predicateGroupUniversalIdentifier: CALL_OWN_PREDICATE_GROUP_UNIVERSAL_IDENTIFIER,
    },
  ],
  fieldPermissions: SYNCED_PERSON_FIELD_PERMISSIONS,
});
