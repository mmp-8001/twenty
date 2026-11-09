# First-click-wins claim and one open deal per contact

Research for issue #72 (part of #61). Question: how a Proopco app (twenty-sdk logic functions calling the Core API) guarantees that a contact never gets two owners and never has two open deals, even when two people click "claim" at the same moment.

Source: this fork's code at `204821bbbc`. Paths are relative to `packages/twenty-server/src/` unless they start with `packages/`.

## Short answer

- **Claim = one conditional bulk update.** Call `updatePeople` (GraphQL) or `PATCH /rest/people?filter=...` with filter `id = :personId AND ownerId IS NULL AND deletedAt IS NULL` and data `{ ownerId: me }`. It runs as a single `UPDATE ... WHERE <filter> RETURNING ...`. Under Postgres READ COMMITTED the second caller waits on the row lock, re-checks `ownerId IS NULL` against the committed row, matches nothing and gets back an **empty array**. One record back means you won; zero means you lost (or the person does not exist).
- **Do not use `updatePerson(id)`** for the claim: it only accepts an id, so it cannot carry the `ownerId IS NULL` condition.
- **One open deal = a unique key that is NULL when the deal is not open.** App indexes are always full (non-partial) unique indexes, and Postgres treats NULLs as distinct. So add an app field on Opportunity, e.g. `openDealKey` (text, `isUnique: true`), set to the person id while the deal is open and to `null` when it is won, lost or trashed. A second open deal for the same person fails with `DUPLICATE_ENTRY_DETECTED`.
- **No transaction spans two API calls.** If the deal create fails after the claim, roll forward (retry the create; a duplicate error means it already exists) and fall back to a conditional release of the owner. A reconciler cron covers crashes in between.

## How a filtered update executes

Trace for both APIs:

1. GraphQL `updatePeople` and REST `PATCH /rest/people` (no id in the path) both call `CommonUpdateManyQueryRunnerService.execute` (`engine/api/rest/core/handlers/rest-api-update-many.handler.ts`, `engine/api/common/common-query-runners/common-update-many-query-runner.service.ts:56-62`). A filter is mandatory (`:123-129`).
2. `runFilteredMutation` turns the filter into a query builder and calls `WorkspaceRepository.runMutation` (`engine/api/common/common-query-runners/common-base-query-runner.service.ts:424-477`). A filter on a plain column needs no join, so the filter is used as is (`utils/build-mutation-query-builder.util.ts:30-37`).
3. `performMutation` (`engine/twenty-orm/repository/workspace-repository.ts:1531`) then:
   - reads a "before image" with the **same WHERE** (`:1580-1590`). This plain SELECT only feeds events, files sync and permission recompute. It takes `FOR UPDATE` only when a validation rule needs previous values (`:1582-1584`).
   - runs the write via `morphAndExecute`: the select builder becomes a mutation builder with the same `whereClauses` (`engine/twenty-orm/query-builder/workspace-select-query-builder.ts:813-845`), executed as `.set(...).returning(...)` (`workspace-repository.ts:1727-1749`).
   - returns `mutationResult.generatedMaps`, the `RETURNING` rows (`:1724`).
4. SQL shape (`engine/twenty-orm/sql/utils/build-mutation-statement.util.ts:104-111`): `UPDATE "schema"."person" AS "person" SET ... WHERE <filter> RETURNING ...`. The filter `{ ownerId: { is: 'NULL' } }` renders as `"person"."ownerId" IS NULL` (`engine/record-filter/utils/compute-where-condition-parts.ts:154-162`).

Why this is safe: the before-image read is not used to decide which rows get written. The UPDATE re-applies the filter itself, so the read-then-write pattern does not break atomicity. No isolation level is set anywhere (`runAtomically` at `workspace-repository.ts:725-731` only opens a default transaction), so Postgres runs at READ COMMITTED. There, a concurrent UPDATE that blocked on a row lock re-evaluates its WHERE against the newly committed row version, so the loser updates 0 rows.

Hooks: the only pre-query hook on `updateMany` is the wildcard `updatedBy` stamp (`engine/core-modules/actor/query-hooks/updated-by.update-many.pre-query-hook.ts`). It only adds data, no read-modify-write. Nothing person- or opportunity-specific is registered.

Result when you lose: `updateMany` returns `[]`, not an error (`common-update-many-query-runner.service.ts:81`). By contrast, `updateOne` wraps the same runner with `filter: { id: { eq } }` and throws `RECORD_NOT_FOUND` on 0 rows (`common-update-one-query-runner.service.ts:43-59`).

Gotcha: an `update` does **not** add `deletedAt IS NULL` automatically. Only `soft-delete` does (`build-mutation-statement.util.ts:60-79`). Put `deletedAt: { is: 'NULL' }` in the claim filter, or a trashed contact can be claimed.

## Unique indexes an app can declare

- `defineIndex` (`packages/twenty-sdk/src/sdk/define/indexes/define-index.ts`, manifest type `packages/twenty-shared/src/application/indexManifestType.ts`) takes fields, `indexType` and `isUnique`. It has **no WHERE clause**: the converter hard-codes `indexWhereClause: null` (`engine/core-modules/application/application-manifest/converters/from-index-manifest-to-universal-flat-index.util.ts:129`). Internally only `"deletedAt" IS NULL` and `"_isPrivate"` are allowlisted (`engine/workspace-manager/workspace-migration/utils/validate-index-where-clause.util.ts`), and apps cannot reach either.
- `defineIndex` can only target **the app's own objects**. It is resolved against maps built from the app's manifest alone, otherwise it fails with "references unknown object" (`engine/core-modules/application/application-manifest/services/compute-application-manifest-all-universal-flat-entity-maps.service.ts:80,178-187`). Standard Person or Opportunity are out of reach this way.
- A field with `isUnique: true` (`packages/twenty-shared/src/application/fieldManifestType.ts:26`) gets a single-column UNIQUE backing index through a metadata side effect. That index is also non-partial (`engine/metadata-modules/flat-field-metadata/utils/generate-deterministic-index-for-flat-field-metadata-or-throw.util.ts:34-35`). App fields can be added to standard objects, so this is the way to get a unique key on Opportunity.
- DDL is plain `CREATE UNIQUE INDEX` with no `NULLS NOT DISTINCT` (`engine/workspace-manager/workspace-migration/workspace-migration-runner/action-handlers/index/utils/index-action-handler.utils.ts:160-170`). So **repeated NULLs are allowed** and **soft-deleted rows still hold their key**.
- A violation maps to `WorkspaceQueryExecutorException` `DUPLICATE_ENTRY_DETECTED` (`engine/workspace-query-executor/error-handling/compute-workspace-query-executor-exception.util.ts:98-106`).

## Transactions across calls

None. Each Core API request runs on its own. Nested relation `create` inside `createMany` (`common-create-many-query-runner.service.ts:637-699`) only creates *related* records. It cannot do a conditional update of another record, and the SDK clients expose no transaction or batch primitive.

## Proposed mechanism

Data model (app manifest):

- Person: `owner` relation to WorkspaceMember (many-to-one, column `ownerId`).
- Opportunity: `openDealKey` text field, `isUnique: true`. Holds the person id while the deal is open, otherwise `null`.

Claim flow (logic function):

1. `updatePeople(filter: { and: [{ id: { eq: personId } }, { ownerId: { is: NULL } }, { deletedAt: { is: NULL } }] }, data: { ownerId: memberId })`. Empty result: return "already claimed" and stop.
2. `createOpportunity({ pointOfContactId: personId, openDealKey: personId, ... })`.
   - Success: done.
   - `DUPLICATE_ENTRY_DETECTED`: an open deal already exists. Stop, and either leave it or reassign it per business rule; never create a second one.
   - Any other error: **roll forward**. Retry the create a few times. It is idempotent because of the unique key: a duplicate on retry means an earlier attempt landed.
   - Still failing: **compensate** with a conditional release, `updatePeople(filter: { id: { eq: personId }, ownerId: { eq: memberId } }, data: { ownerId: null })`. The `ownerId = me` guard keeps it from undoing a later legitimate change.
3. Reconciler (cron logic function) for crashes between steps 1 and 2. Find persons with an owner, no Opportunity with `openDealKey = person.id`, and `updatedAt` older than a few minutes. Then create the deal or release the owner.

Keeping the key honest:

- Closing a deal (won/lost) must set `openDealKey: null` in the same update that changes the stage.
- Trashing a deal must clear the key first, or a logic function on the opportunity delete/update event must do it. Otherwise the trashed row keeps blocking new deals, because the index is not soft-delete aware. Restoring a deal sets the key again, and that fails cleanly if another open deal exists.
- Users editing deals in the UI bypass the app logic. If that matters, hide or lock `openDealKey` with field permissions, and use a DB-event logic function to recompute it from the stage.

## Not verified

- Which field types accept `isUnique` for app fields (text is assumed). Check when implementing.
- No live concurrency test was run. The READ COMMITTED re-check is standard Postgres behavior; an integration test that fires two parallel claims would confirm it end to end.
