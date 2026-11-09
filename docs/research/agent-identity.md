# Agent identity: extend WorkspaceMember or add an Agent object?

Ticket: #71. Read against this repo at `204821bbbc` (main). Paths are relative to the repo root.

## Recommendation

**Add an app-owned `Agent` object and link it to `WorkspaceMember` with a many-to-one field that lives on `WorkspaceMember` (`workspaceMember.agent`, `onDelete: SET_NULL`).** Point the app's owner fields at `Agent` with `onDelete: RESTRICT`: `Person.owner`, plus a differently named field on Opportunity (for example `agent`), because the standard `Opportunity.owner -> workspaceMember` already holds that name. Keep `isActive`, `frozenSince` and `ownedContactCount` on `Agent`.

Why:

- **The data outlives the login.** Removing a member hard-deletes the `workspaceMember` row. Custom fields on that row are lost with it, and `SET_NULL` owner FKs pointing at it are cleared, so you can't tell afterwards who owned what. An `Agent` row survives, with its contacts still attached.
- **"Owner IS me" row rules still work.** The predicate compares a many-to-one field on the record with a many-to-one field on the current workspace member, as long as both point at the same object. `Person.owner -> Agent` plus `workspaceMember.agent -> Agent` passes that check.
- **The only hard block on removing a member is a FK, and it is crude.** If you need one, put `RESTRICT` on `Agent.member`, not on business records. The cleaner rule is "deactivate means change the role, never delete the member" (see below).

Extending `WorkspaceMember` directly is technically allowed. It is fine for small, disposable per-user fields, but it is a poor home for business ownership.

## Facts

### 1. Can an app add fields to WorkspaceMember?

Yes. Nothing blocks it.

- `workspaceMember` is in `STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS` (`20202020-3319-4234-a34c-82d5c0e881a6`). See `packages/twenty-shared/src/metadata/constants/standard-object-universal-identifiers.constant.ts:33`. The SDK re-exports it in `packages/twenty-sdk/src/sdk/define/objects/standard-object-ids.ts`.
- `defineField` only checks `objectUniversalIdentifier`, label, name, select options and unique-on-relation. It has no rule for system objects or `workspaceMember` (`packages/twenty-sdk/src/sdk/define/fields/define-field.ts`, `validate-fields.ts`).
- `workspaceMember` is a system object (`isSystem: true`, `isUICreatable: false`) in `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/utils/object-metadata/create-standard-flat-object-metadata.util.ts:1786-1817`. The server-side field validators never use the target object's `isSystem` to reject a field or relation (`packages/twenty-server/src/engine/metadata-modules/flat-field-metadata/validators/utils/`).

### 2. Can app relations target WorkspaceMember?

Yes.

- The server relation validator only checks that the target object and field exist, that the inverse field points back, and that `onDelete` appears only on MANY_TO_ONE (`validate-morph-or-relation-flat-field-metadata.util.ts`, `validate-morph-or-relation-flat-field-on-delete.util.ts`). Nothing checks system or standard objects.
- The core standard objects already do this. `Company.accountOwner` and `Opportunity.owner` both point at `workspaceMember` with `onDelete: SET_NULL` (`compute-company-standard-flat-field-metadata.util.ts:393-417`, `compute-opportunity-standard-flat-field-metadata.util.ts:668-684`). `Person` has no standard owner field, so the app has to add one.
- **Gotcha:** if `onDelete` is not set, the DB foreign key defaults to **CASCADE** (`.../action-handlers/field/services/utils/compute-foreign-key-on-delete.util.ts`: `convertOnDeleteActionToOnDelete(onDelete) ?? 'CASCADE'`). An app `Person.owner -> workspaceMember` field without an explicit `onDelete` would delete that agent's contacts when the member is removed. Always set `onDelete` explicitly.

### 3. How row rules reference "the current member"

- A role manifest predicate has `fieldUniversalIdentifier`, `operand` and `workspaceMemberFieldUniversalIdentifier` (`packages/twenty-shared/src/application/roleManifestType.ts:26-33`, `packages/twenty-sdk/src/sdk/define/roles/define-role.ts`). "Owner IS me" means: record field `owner`, operand `IS`, member field `workspaceMember.id` (pattern used in `packages/twenty-server/test/integration/metadata/suites/application/successful-manifest-sync-row-level-permission-predicate.integration-spec.ts:26-75`).
- The validator requires the member field to be a field of `workspaceMember`. For relation fields, the operand must be IS or IS_NOT, both sides must be owning MANY_TO_ONE relations, and both must point at the same object (`.../validators/services/flat-row-level-permission-predicate-validator.service.ts:628-727`). So `Person.owner -> Agent` compared with `workspaceMember.agent -> Agent` is valid.
- At runtime, the current member comes from the main principal's `workspaceMemberId`. A relation member field resolves to the member row's join column, read from the `flatWorkspaceMemberMaps` cache (`packages/twenty-server/src/engine/permissions/internal/rls/utils/resolve-row-level-permission-workspace-member.util.ts`, `resolve-workspace-member-predicate-value.util.ts`). The cache loads full member rows, custom columns included (`engine/core-modules/user/services/workspace-flat-workspace-member-map-cache.service.ts`). It is recomputed on every workspaceMember create, update, delete, destroy or restore (`engine/core-modules/user/services/global-workspace-member.listener.ts:27-45`).
- Multi-hop predicates such as `Person.owner.member IS me` sit behind `IS_ROW_LEVEL_PERMISSION_RELATION_HOP_ENABLED` and `IS_ACCESS_GROUPS_ENABLED` (`.../rls/utils/is-row-level-permission-relation-hop-enabled.util.ts`). Don't depend on them. Use the direct `workspaceMember.agent` field instead.
- **Licensing:** row-level predicates need a valid enterprise plan **and** the `RLS` billing entitlement (`engine/metadata-modules/row-level-permission-predicate/services/row-level-permission-predicate.service.ts:489-500`). The RLS code is marked `@license Enterprise`.

### 4. What happens to records owned by a removed member

- `workspaceMember.deleteOne` and `deleteMany` over the API always throw "use /deleteUserFromWorkspace" (`packages/twenty-server/src/modules/workspace-member/query-hooks/workspace-member-delete-one.pre-query.hook.ts`). `destroy*` throws PERMISSION_DENIED. `updateMany` is denied.
- Removal goes through the `deleteUserFromWorkspace` mutation (`engine/core-modules/user/user.resolver.ts:434`), which needs either self or the `WORKSPACE_MEMBERS` permission flag. It then calls `UserService.removeUserFromWorkspaceAndPotentiallyDeleteWorkspace` (`engine/core-modules/user/services/user.service.ts:325-431`), which:
  1. refuses to remove the last admin,
  2. transfers connected accounts and record shares to a successor,
  3. detaches agent-chat threads,
  4. runs `workspaceMemberRepository.delete({ userId })`, a **hard delete** (in `engine/twenty-orm/repository/workspace-repository.ts`, `delete` maps to `destroy` and emits `DESTROYED`),
  5. deletes the userWorkspace and recomputes the member cache.
- Records that point at the member therefore follow the DB FK: SET_NULL clears the owner, CASCADE deletes the record, RESTRICT makes step 4 fail.
- Nothing reassigns business records such as `accountOwner` or `owner`. They are simply cleared.

### 5. Can anything block member removal?

- **Apps get no pre-delete hook.** `@WorkspaceQueryHook` pre/post hooks are server-internal NestJS classes. App database-event triggers fire after the write. Validation rules (`defineValidationRule`) run only on insert and update (`runWithValidationRules` wraps `runInsert`/`runBatchUpdate`, `workspace-repository.ts:733-778`), never on delete. They can only resolve MANY_TO_ONE bindings, not one-to-many counts (`engine/twenty-orm/utils/validate-records-against-validation-rules.util.ts:89-120`).
- **Only one blocking mechanism exists: an `onDelete: RESTRICT` FK** pointing at `workspaceMember`. The relation validator accepts RESTRICT on any MANY_TO_ONE. Caveat: the removal flow is not one transaction. Steps 2-3 (connected-account and record-share transfer, chat detach) run **before** the delete that fails, so a blocked removal leaves those side effects behind and shows the admin a raw FK error. Verify with an integration test before relying on it.

### 6. Role change as "deactivate"

- Every userWorkspace has exactly one role. There is no unassign, only reassign (`engine/permissions/role-assignment/role-assignment-write.service.ts:32-90`). Self-assignment is refused, and the last admin is protected (`:297`).
- An app can ship a role with `canBeAssignedToUsers: true` and no object permissions (`roleManifestType.ts:43`). Moving a departed agent to that role cuts off their access and keeps the member row, the `Agent` row and all ownership intact. There is no native "suspended member" state in user-workspace or role code.
- This fits `isActive: false` + `frozenSince` better than deletion. Deactivation becomes an app action (logic function or front component) that checks `ownedContactCount === 0` (or reassigns contacts first), sets `Agent.isActive = false`, and swaps the role.

## How the requirements map to the recommended model

| Need | Where it lives |
|---|---|
| `isActive`, `frozenSince` | fields on `Agent` |
| owned contact count | NUMBER field on `Agent`, maintained by a logic function on Person create/update/delete events (no rollup field type exists: `packages/twenty-shared/src/types/FieldMetadataType.ts`). The count is async, so recount inside the deactivate action before you trust it. |
| `Person.owner`, Opportunity agent | app MANY_TO_ONE fields -> `Agent` (Opportunity needs a new name, since standard `owner` is taken), `onDelete: RESTRICT` (an Agent can't be deleted while it owns records) |
| owner IS me | predicate `owner IS workspaceMember.agent` (needs enterprise + RLS entitlement) |
| block deactivation with owned contacts | in the app's deactivate action. Optionally add a validation rule on `Agent`: `isActive == false` only if `ownedContactCount == 0` (works only as well as the stored count is current) |
| block member removal | policy: deactivate, don't remove. Optional hard stop: `Agent.member` with `onDelete: RESTRICT` (with the partial-side-effect caveat above). Default to `SET_NULL` so removal still works and the Agent survives. |

## Not verified

- No running app or integration test was used. The FK and RESTRICT behaviour during member removal is read from code only.
- I did not check the twenty-front settings UI for how a RESTRICT failure is shown.
