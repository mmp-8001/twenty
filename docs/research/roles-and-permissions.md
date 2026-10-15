# Twenty roles and permissions

Research for issue #8, feeding the CRM demo map (#4). Question: how roles work inside a workspace (object, field, row level), whether a sales employee can be limited to the leads assigned to them, and what a support agent, a manager and an API key can be restricted to.

Sources, highest trust first: this fork's code at `44ca3bf585` (synced with upstream `twentyhq/twenty` at `516d49a7f6`), the docs shipped in `packages/twenty-docs` (identical to upstream main), the root `LICENSE`, and https://twenty.com/pricing. Paths below are relative to `packages/twenty-server/src/` unless they start with `packages/` or are the repo root.

## Short answer

- Roles are per workspace. Each workspace member has exactly one role; API keys and AI agents can each hold a role too.
- Object-level and field-level permissions are in the open source (AGPL) core. No enterprise key needed.
- Row-level permissions ("only the leads assigned to me") exist and do what the demo needs, but they are enterprise code: managing them requires a valid enterprise validity token, plus the `RLS` billing entitlement when billing is enabled.
- In this fork, `NODE_ENV=development` or `test` treats the enterprise check as valid, so the demo works locally. Running a production build on the VPS needs a real enterprise key (Organization plan) or the demo has to run in development mode, which the commercial license only allows for development and testing.

## Model

A role (`engine/metadata-modules/role/role.entity.ts`) carries:

- Baseline record flags for all objects: `canReadAllObjectRecords`, `canUpdateAllObjectRecords`, `canSoftDeleteAllObjectRecords`, `canDestroyAllObjectRecords`.
- Settings and tools baselines: `canUpdateAllSettings`, `canAccessAllTools`.
- Who it can be given to: `canBeAssignedToUsers`, `canBeAssignedToAgents`, `canBeAssignedToApiKeys`.
- Children: `objectPermissions`, `fieldPermissions`, `rolePermissionFlags`, `rowLevelPermissionPredicates`, `rowLevelPermissionPredicateGroups`, and `roleTargets`.

Assignment is a `RoleTarget` row with exactly one of `userWorkspaceId`, `agentId`, `apiKeyId` (`engine/metadata-modules/role-target/role-target.entity.ts`). A user has one role per workspace (`packages/twenty-docs/user-guide/permissions-access/how-tos/permissions-faq.mdx`: "each user can only have one role at a time"). The workspace has a `defaultRoleId` for new members (`engine/core-modules/workspace/workspace.entity.ts`). The only seeded standard role is Admin (`engine/workspace-manager/twenty-standard-application/constants/standard-role.constant.ts`); every other role is custom.

Since every brand is its own workspace (#4), roles, members and API keys are naturally isolated per brand.

### Object level (open source)

`engine/metadata-modules/object-permission/object-permission.entity.ts`: per role and object, nullable `canReadObjectRecords`, `canUpdateObjectRecords`, `canSoftDeleteObjectRecords`, `canDestroyObjectRecords`. Null inherits the role baseline; a value overrides it (docs: `packages/twenty-docs/user-guide/permissions-access/capabilities/permissions.mdx`, "How Permission Inheritance Works").

### Field level (open source)

`engine/metadata-modules/object-permission/field-permission/field-permission.entity.ts`: per role, object and field, `canReadFieldValue` and `canUpdateFieldValue`. Both are validated to be only `false` or `null`, so field permissions can only take away access the object level granted, never add it. UI offers See / Edit / No access per field.

### Permission flags (open source)

`packages/twenty-shared/src/constants/PermissionFlagType.ts`. Settings flags: `API_KEYS_AND_WEBHOOKS`, `WORKSPACE`, `WORKSPACE_MEMBERS`, `ROLES`, `DATA_MODEL`, `SECURITY`, `WORKFLOWS`, `IMPERSONATE`, `SSO_BYPASS`, `APPLICATIONS`, `MARKETPLACE_APPS`, `LAYOUTS`, `BILLING`, `AI_SETTINGS`. Action/tool flags: `AI`, `VIEWS`, `UPLOAD_FILE`, `DOWNLOAD_FILE`, `SEND_EMAIL_TOOL`, `CREATE_CALENDAR_EVENT_TOOL`, `HTTP_REQUEST_TOOL`, `CODE_INTERPRETER_TOOL`, `IMPORT_CSV`, `EXPORT_CSV`, `CONNECTED_ACCOUNTS`, `PROFILE_INFORMATION`. `canUpdateAllSettings` / `canAccessAllTools` grant all of a group at once.

Note the docs warn that manually triggering workflows currently needs the `WORKFLOWS` settings flag (permissions.mdx, "Current limitation").

### Row level (enterprise)

Entities: `engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate.entity.ts` and `...-predicate-group.entity.ts`. A predicate belongs to a role and object and has `fieldMetadataId`, `operand` (`IS`, `IS_NOT`, `CONTAINS`, `IS_EMPTY`, `IS_BEFORE`, date operands, etc., `packages/twenty-shared/src/types/RowLevelPermissionPredicateOperand.ts`), a static `value`, and optionally `workspaceMemberFieldMetadataId`. Groups combine predicates with AND/OR and can nest.

`workspaceMemberFieldMetadataId` is what makes "my records" possible: the predicate value is taken from the acting workspace member at query time (`engine/twenty-orm/utils/build-row-level-permission-record-filter.util.ts`). The integration test `packages/twenty-server/test/integration/graphql/suites/object-records-permissions/record-level-permissions-on-relation.integration-spec.ts` binds `company.region IS workspaceMember.region` and asserts the member only reads, and only creates, records in their own region. The same shape gives `lead.assignee IS currentMember` for sales employees.

Enforcement is in the ORM (`engine/twenty-orm/repository/workspace-repository.ts`, `applyRowLevelPermissionPredicates`) on reads and writes, so it covers GraphQL, REST, and workflows running as the user, not just the UI. Two safety details:

- If a member-bound predicate cannot be resolved (API key with no member, member field empty), it becomes a branch that never matches instead of being dropped, so the restriction fails closed (comment in `build-row-level-permission-record-filter.util.ts`).
- Validation rejects a predicate whose `workspaceMemberFieldMetadataId` is not a workspace member field (`utils/validate-row-level-permission-rule-ownership.util.ts`).

## Enterprise gating

Enterprise code is marked `/* @license Enterprise */` and is under the Twenty Commercial License at the bottom of the root `LICENSE`: production use requires a valid Enterprise Edition subscription; copying and modifying "for development and testing purposes" needs none.

| Capability | Gate | Source |
|---|---|---|
| Roles, object permissions, field permissions, permission flags, roles on API keys and agents | none (AGPL) | no enterprise check in `role`, `object-permission`, `role-target` modules |
| Row-level permissions | `EnterprisePlanService.isValid()` AND `BillingService.hasEntitlement(RLS)` (true when billing disabled) | `row-level-permission-predicate.service.ts` `hasRowLevelPermissionFeature`, same in `...-predicate-group.service.ts` |
| SSO (SAML/OIDC) | `EnterpriseFeaturesEnabledGuard` | `engine/core-modules/sso/sso.resolver.ts`, `auth/controllers/sso-auth.controller.ts` |
| Audit logs | `isValid()` | `engine/core-modules/event-logs/event-logs.service.ts` |
| Others marked enterprise | record sharing, email group access, custom AI provider, signing key rotation | `engine/core-modules/record-share`, `emailing-domain/services/email-group-access.service.ts`, `enterprise/services/custom-ai-provider-access.service.ts`, `jwt/crons/jobs/rotate-signing-keys.cron.job.ts` |

Without a valid plan, listing predicates returns empty and creating or updating them throws. The ORM itself does not re-check the license, it applies whatever predicates are cached, but the UI and API cannot manage them.

Fork change `8faa7e9bc0` (#3) makes `isCachedValidityPayloadValid()` return true when `NODE_ENV` is `development` or `test` (`engine/core-modules/enterprise/services/enterprise-plan.service.ts`). Billing is off by default on self-hosted, so the `RLS` entitlement passes. Result: row-level permissions, SSO and audit logs all work in dev and test; production still needs a key.

Pricing (https://twenty.com/pricing, read 2026-10-15): Pro $9/user/month has unlimited roles and field-level permissions but no row-level permissions, SSO or audit logs; Organization $19/user/month adds them; Enterprise from $50k/year. The docs call row-level permissions "a Premium feature available on the Organization plan (Cloud and Self-Hosted)" (permissions.mdx). The pricing page does not spell out the self-hosted key price.

## Applied to the demo personas

Suggested roles per brand workspace. Everything except the row-level lines works without a key.

- **Sales employee**: read/update Leads, People, Companies; no Destroy; field "No access" on commission fields if they should not see others' numbers; no settings flags. Row level: `Lead.assignee IS current member` (and the same on Opportunities/Tasks if those are used). Reassignment then lies with managers, since a sales employee editing the assignee away would lose sight of the record.
- **Support agent**: read customers (People), read/update the support object (ticket or conversation, see open question in #4); no access to Leads or commission objects via object-level rules. Row level optional: tickets `assignee IS current member`, or team-based by matching a member field like `team`.
- **Manager**: all records on brand objects, update including the assignee field (reassignment), `EXPORT_CSV`, `VIEWS`, `WORKSPACE_MEMBERS` if they manage staff; no `ROLES`/`DATA_MODEL`/`SECURITY` unless they are admin. No row-level predicates.
- **API key (mock backend)**: role is mandatory, `CreateApiKeyInput.roleId` is required (`engine/core-modules/api-key/dtos/create-api-key.input.ts`), and creating a key needs the `ROLES` flag to stop privilege escalation (`api-key.resolver.ts`). Give it read/update on People, Leads and event objects, no Destroy, `canBeAssignedToUsers=false`, no settings flags. Do not put member-bound row-level predicates on the API key role: with no member they never match and the key sees nothing. (The docs line "API keys without an assigned role use default permissions" is outdated against this code: a key cannot be created without a role, and a key with no role map entry resolves to no roles.)
- **Admin**: the standard Admin role, at least one member must keep it (permissions.mdx).

## Open points for #4

- Licensing: the demo VPS is self-hosted for brand management. Running it in `NODE_ENV=development` to get row-level permissions is only clearly allowed for "development and testing" under the commercial license. Either buy an Organization key, accept dev mode for a demo explicitly framed as testing, or drop row-level and show per-member views/filters (not a security boundary).
- The Leads object needs an `assignee` relation to Workspace Member for the predicate; round-robin assignment then writes that field.
