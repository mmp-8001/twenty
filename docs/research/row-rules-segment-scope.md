# Can row rules hide contacts outside an agent's segments everywhere?

Ticket: #63 (map #61). Need: PRD invariant 6 — a Sales Admin never sees a Person outside their scope
(contacts in segments of campaigns they work, plus contacts they own) in search, direct links, API, anywhere.

Proposed rule: the app keeps an ARRAY field on Person (`eligibleMembers`, workspace member ids) and the
Sales Admin role gets `owner IS me OR eligibleMembers CONTAINS me`.

Researched against the code on `main` at `204821bbbc` (paths relative to `packages/`).

## Verdict: works, with caveats

The server accepts and enforces the rule, and enforcement sits in the ORM, so search, direct links,
GraphQL, REST, aggregates and joins are all covered. The catches:

1. It can only be defined through an **app manifest** (or the GraphQL `upsertRowLevelPermissionPredicates`
   mutation), not the Settings UI.
2. `CONTAINS` on an ARRAY compiles to a per-row `unnest … ILIKE '%<uuid>%'`, which no index can serve.
3. A few read paths skip permission checks (listed below), mainly the email and calendar timelines.
4. Row rules only run while the workspace holds the `RLS` billing entitlement (Organization plan). Losing
   it **deletes** the rules, so contacts become visible again.

## How to express the rule

Two predicates on Person in one `OR` predicate group, on the Sales Admin role:

| Predicate | field | operand | bound to |
|---|---|---|---|
| owner is me | `Person.owner` (custom MANY_TO_ONE → workspaceMember) | `IS` | value `{"isCurrentWorkspaceMemberSelected":true}` (the "Me" option) |
| eligible contains me | `Person.eligibleMembers` (ARRAY) | `CONTAINS` | `workspaceMemberFieldUniversalIdentifier` = workspaceMember `id` field |

Person has no standard owner relation (only `createdBy` ACTOR), so `owner` is a custom field.
`createdBy.workspaceMemberId IS me` also works if "owner" means "creator".

## Key facts (with sources)

**Operators**
- The ARRAY filter type allows `CONTAINS`, `DOES_NOT_CONTAIN`, `IS_EMPTY` and `IS_NOT_EMPTY`
  (`twenty-shared/src/utils/filter/utils/filterOperandsMap.ts`). The predicate validator allows exactly
  those operands per field type (`getUnsupportedOperandError` in
  `twenty-server/src/engine/workspace-manager/workspace-migration/workspace-migration-builder/validators/services/flat-row-level-permission-predicate-validator.service.ts`).
- RELATION fields allow `IS`/`IS_NOT` only. A predicate bound to a workspace member value must sit on a
  MANY_TO_ONE relation (`getWorkspaceMemberFieldError`, same file).

**How "me" resolves**
- A predicate can bind its value to a field of the current user's workspaceMember
  (`workspaceMemberFieldMetadataId` in `twenty-shared/src/types/RowLevelPermissionPredicate.ts`). On the
  server the only check is that the field belongs to `workspaceMember`. For a non-relation field the value is
  read from the member record (`twenty-server/src/engine/permissions/internal/rls/utils/resolve-workspace-member-predicate-value.util.ts`),
  so binding to `id` gives the current member's uuid.
- The ARRAY `CONTAINS` filter becomes `{ field: { containsIlike: '%<value>%' } }`
  (`twenty-shared/src/utils/filter/turnRecordFilterIntoGqlOperationFilter.ts`, `case 'ARRAY'`), which renders as
  `EXISTS (SELECT 1 FROM unnest(col) elem WHERE elem ILIKE :v)`
  (`twenty-server/src/engine/record-filter/utils/compute-where-condition-parts.ts`). Because every element is a
  36-character uuid, the substring match only hits on the exact id, so it behaves as exact membership.
- If the bound value cannot be resolved (for example an API key with no member), the predicate becomes a
  never-matching branch, not a dropped one, so it fails closed
  (`twenty-server/src/engine/permissions/internal/rls/utils/build-row-level-permission-record-filter.util.ts`).
- Writes are checked against the rule too: a created or updated record must still match it, or the write
  fails with `RLS_VALIDATION_FAILED`
  (`twenty-server/src/engine/permissions/internal/rls/utils/validate-rls-predicates-for-records.util.ts`). The
  in-memory matcher supports `containsIlike` on arrays (`twenty-shared/src/utils/filter/utils/isMatchingArrayFilter.ts`).
- Predicates within a role are combined by groups (AND by default, OR via a group). When a member holds
  several roles, each role is compiled separately and the results are ANDed (same file).

**Authoring**
- The Settings UI can't build this rule. Its field list leaves out ARRAY
  (`twenty-front/src/modules/settings/roles/role-permissions/object-level-permissions/record-level-permissions/constants/RecordLevelPermissionPredicateFieldTypes.ts`).
  Its "Me" picker also hides workspaceMember `id` and only offers fields of the same type
  (`…/components/SettingsRolePermissionsObjectLevelRecordLevelPermissionMeValueSelect.tsx`).
- An app manifest can define it: `RowLevelPermissionPredicateManifest` has `operand`,
  `workspaceMemberFieldUniversalIdentifier` and `predicateGroupUniversalIdentifier`
  (`twenty-shared/src/application/roleManifestType.ts`; docs `twenty-docs/developers/extend/apps/config/roles.mdx`,
  "Row-level security"). Roles that ship in an app are not editable in the UI (`isEditable` check in
  `…/validators/utils/get-role-not-editable-errors.util.ts`), so an admin can't break the rule by editing it there.

**Where it is enforced**
- `WorkspaceRepository.onBeforeExecute` applies row rules to every select built through the workspace ORM.
  That covers the main alias **and every joined alias**
  (`twenty-server/src/engine/twenty-orm/repository/workspace-repository.ts`, `applyRowLevelPermissionPredicates`).
  `getCount` goes through the same hook (`twenty-server/src/engine/twenty-orm/query-builder/workspace-select-query-builder.ts`).
- Covered as a result:
  - find, findOne and direct links / the record show page (GraphQL and REST share the common query runners)
  - search and the command menu, which use a permissioned repository (`twenty-server/src/engine/core-modules/search/services/search.service.ts`)
  - relation pickers, which go through search
  - nested relations: an out-of-scope `pointOfContact` on a visible Opportunity comes back empty (`…/common-nested-relations-processor/process-nested-relations.helper.ts`)
  - group-by, aggregates and dashboard charts (`…/group-by/services/group-by-with-records.service.ts`)
  - AI chat and MCP record tools
  - realtime subscriptions, webhooks, workflow DB triggers and logic-function DB triggers, all filtered per recipient by `RecordEventPermissionsReadService` (`twenty-server/src/engine/permissions/record-event-permissions-read.service.ts`)
- Bypassed: any repository from `getRepositoryWithoutPermissionChecks`, any call with
  `shouldBypassPermissionChecks: true`, and any request with a system auth context
  (`twenty-server/src/engine/twenty-orm/datasource/workspace-data-source.ts`).

**Plan and flags**
- No feature flag is needed for the proposed rule. `IS_ROW_LEVEL_PERMISSION_RELATION_HOP_ENABLED` (off by
  default) only matters for the junction alternative below.
- Enforcement requires the `RLS` billing entitlement. When it is revoked,
  `billing-entitlement-sync.service.ts` calls `deleteAllRowLevelPermissionPredicateGroups`, and the docs add
  that predicates from a manifest "still sync, they are simply not enforced" on lower plans (`roles.mdx`).
  Self-hosted installs need an enterprise key (files carry `@license Enterprise`).

## Surfaces NOT covered

1. **Email timeline** (`twenty-server/src/engine/core-modules/messaging/services/timeline-messaging.service.ts`):
   this read skips permission checks. On a thread attached to a record the agent *can* see, it returns each
   participant's Person `id`, first and last name and avatar, even when that Person is out of scope.
2. **Calendar timeline** (`twenty-server/src/engine/core-modules/calendar/timeline-calendar-event.service.ts`):
   same leak for event participants. A TODO in the code says it should run under the caller's role.
3. **Participant handles stored on message and calendar participants** (email address, display name) are not
   Person fields, so a row rule never hides them.
4. **Timeline activity** target resolution reads junctions and source records without permission checks
   (`twenty-server/src/modules/timeline/services/timeline-activity-target-query.service.ts`). Whether an
   out-of-scope Person's cached name can show on a visible record's timeline is **unverified**.
5. **Workflows and logic functions** run under the workflow or app role, not the agent's role. If agents can
   author workflows or read run outputs, those outputs can include any Person.
6. **Admin-panel workspace data export** skips permission checks, but only server admins can reach it.
7. **Manual-test gap:** nothing here exercised the rule end to end. In particular, check that `id` resolves
   through `memberFieldValues` when `IS_ACCESS_GROUPS_ENABLED` is on
   (`resolve-member-field-values-predicate-value.util.ts`, keyed by `buildMemberFieldKey`).

## Alternatives

- **Junction relation hop**: a `PersonEligibility` object with Person and workspaceMember as MANY_TO_ONE,
  then the predicate `Person.eligibilities → PersonEligibility.workspaceMember IS me`. It renders as an indexed
  `EXISTS` subquery and handles one-to-many (`render-row-level-permission-filter-to-sql.util.ts`,
  `find-relation-join-columns-or-throw.util.ts`), so it scales better than `unnest ILIKE`. It needs
  `IS_ROW_LEVEL_PERMISSION_RELATION_HOP_ENABLED`, and the manifest converter hard-codes
  `relationFieldMetadataUniversalIdentifier: null`
  (`…/from-row-level-permission-predicate-manifest-to-universal-flat-row-level-permission-predicate.util.ts`),
  so today it can only be authored with `upsertRowLevelPermissionPredicates`.
- **TEXT field with CONTAINS** (for example `",<id>,<id>,"`): works the same way through `ilike`, with no gain
  over ARRAY.
- **One field per segment**: doesn't scale, and a predicate can't be added per agent at runtime.

## Recommendation

Use the ARRAY rule from the app manifest. Make `eligibleMembers` (and `owner`) read-only for the Sales Admin
role with field permissions, so agents can't widen their own scope. Treat the email and calendar timeline
participant leak (items 1–2) as a known gap, or hide those tabs for the role. Measure Person-list latency at
the target row count, and move to the junction hop if the `unnest` scan is too slow.
