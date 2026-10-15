# Twenty data model customization and scripted setup

Research for issue #6, feeding map #4 (Persian demo, one workspace per brand).
Sources are this fork's code and docs at commit `44ca3bf585`. The docs under
`packages/twenty-docs/` are the source of docs.twenty.com, so each path maps to
`https://docs.twenty.com/<path without .mdx>`.

## Answer in short

- Everything the demo needs (custom objects, custom fields on Person/Company/Opportunity, select options, relations, unique external id and phone) can be declared in code.
- Recommended path: one **twenty-sdk app** holding the data model (plus views, navigation, roles), installed into each brand workspace, and a **separate seed script** that writes records over the Core GraphQL API with `upsert: true` keyed on unique fields. The in-repo `real-estate` app is a working precedent of "data model + seed in one app".
- The Metadata API (`/metadata`, `/rest/metadata`) is the lower-level alternative; it can also edit standard objects (labels, options, deactivation), which an app does not do.
- Not scriptable through public, key-authenticated APIs: creating the workspaces themselves and the first API key per workspace (they need a logged-in user session). Workflows have no `define*` entity.

## 1. What can be customized

### Objects and fields

- Custom objects: `defineObject` with name/labels, icon, color, fields, `openRecordIn`, readability/writability. System fields (`id`, `name`, `createdAt`, `createdBy`, `deletedAt`, ...) are added automatically.
  Source: `packages/twenty-docs/developers/extend/apps/data/objects.mdx`.
- Fields on objects you do not own (standard Person, Company, Opportunity): `defineField` with `objectUniversalIdentifier` from `STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS`.
  Source: `packages/twenty-docs/developers/extend/apps/data/extending-objects.mdx`.
- Field types: `TEXT`, `RICH_TEXT`, `ARRAY`, `RAW_JSON`, `NUMBER`, `NUMERIC`, `RATING`, `DATE`, `DATE_TIME`, `BOOLEAN`, `SELECT`, `MULTI_SELECT`, `FULL_NAME`, `ADDRESS`, `EMAILS`, `PHONES`, `LINKS`, `CURRENCY`, `ACTOR`, `FILES`, `UUID`, `RELATION`, `MORPH_RELATION`. Source: objects.mdx, "Field types".
- Select options: non-empty `options` array of `{ value, label, position, color? }`, color from a fixed palette. Literal string defaults must be single-quoted inside the string (`"'NEW'"`). Source: objects.mdx, "Select options" and "Default values"; validation in `packages/twenty-sdk/src/sdk/define/fields/validate-fields.ts`.
- `isNullable: false` needs a non-null default when applied to an existing field. Source: objects.mdx, "Nullability".

### Relations

- Always bidirectional: two `RELATION` fields pointing at each other (`MANY_TO_ONE` side holds `joinColumnName` and `onDelete`; `ONE_TO_MANY` is the inverse). Relating to a standard object still requires declaring the reverse field on the standard object, or sync fails with `Relation field target metadata not found`. Junction objects are supported for many-to-many.
  Source: `packages/twenty-docs/developers/extend/apps/data/relations.mdx`.

### Unique fields (external id, phone)

- `defineIndex({ isUnique: true, fields: [...] })` is the current primitive, single or multi-column; `defineField({ isUnique: true })` still works but is documented as deprecated. Max 10 custom indexes per object; no partial `WHERE` clauses from apps.
  Source: `packages/twenty-docs/developers/extend/apps/data/overview.mdx` ("Unique indexes"); `packages/twenty-shared/src/application/indexManifestType.ts`.
- `isUnique` is rejected on `RELATION`, `MORPH_RELATION` and `FILES` (`validate-fields.ts`).
- Unique on a `PHONES` field covers `primaryPhoneNumber`, `primaryPhoneCountryCode` and `primaryPhoneCallingCode` together (`isIncludedInUniqueConstraint`), not `additionalPhones`. So phone matching for lead conversion should store a normalized primary number plus calling code consistently (for example `+98`), or use a plain `TEXT` field such as `phoneE164` with its own unique index. An index field entry also accepts `subFieldName` to target a single sub-column.
  Source: `packages/twenty-shared/src/types/composite-types/phones.composite-type.ts`; `packages/twenty-shared/src/application/indexFieldManifestType.ts`.
- Soft-deleted records still count toward uniqueness; an upsert matching a deleted record restores it.
  Source: `packages/twenty-docs/user-guide/data-migration/capabilities/uniqueness-constraints.mdx`.
- Standard fields can be made unique too: `isUnique` is in the editable set for both custom and standard fields (`packages/twenty-server/src/engine/metadata-modules/flat-field-metadata/constants/flat-field-metadata-editable-properties.constant.ts`).

### Standard objects

- Through the Metadata API, standard objects allow editing `labelSingular`, `labelPlural`, `description`, `icon`, `color`, `isActive`, `isSearchable`, but not their API names. Standard fields allow `label`, `options`, `defaultValue`, `isActive`, `isUnique`, but not `name`.
  Source: `packages/twenty-server/src/engine/metadata-modules/flat-object-metadata/constants/flat-object-metadata-editable-properties.constant.ts` and the field constant above.
- Persian relabelling of standard objects (for example Person as "مشتری") therefore goes through the Metadata API or the Settings UI, not the app manifest. Not verified whether an app can override a standard object's labels; assume not.

### Beyond the data model (also declarable in an app)

Views, navigation menu items, page layouts, roles, logic functions (HTTP, cron, database-event triggers), front components, skills/agents, timeline activity types.
Source: `packages/twenty-docs/developers/extend/apps/getting-started/concepts.mdx`, "Entity types".

## 2. Applying it reproducibly

### Option A (recommended): twenty-sdk app + seed script

1. Scaffold with `npx create-twenty-app`, declare objects/fields/indexes/views as `define*` files with stable `universalIdentifier` UUIDs. Labels can be written directly in Persian; a translation catalog flow also exists (`packages/twenty-docs/developers/extend/apps/operations/translations.mdx`).
2. Add one CLI remote per brand workspace, non-interactively:
   `yarn twenty remote:add --url https://crm.example --api-key $GERAMI_KEY --as gerami` (same for kifpool, proopco).
   Source: `packages/twenty-docs/developers/extend/apps/operations/cli.mdx`, "Managing remotes".
3. Deploy once as a private tarball and install per workspace:
   `yarn twenty app:publish --private -r gerami`, then `yarn twenty app:install -r kifpool`, `-r proopco`. Version must strictly increase on each redeploy.
   Source: `packages/twenty-docs/developers/extend/apps/operations/publishing.mdx` ("Deploying to a server (tarball)", "Version management"); `packages/twenty-sdk/src/cli/commands/app/install.ts`.
4. `yarn twenty plan` previews the metadata diff; `yarn twenty apply [--force] [--no-delete]` is the one-shot sync for scripts. Syncs are idempotent and delete app-owned entities no longer in source unless `--no-delete`.
   Source: `packages/twenty-docs/developers/extend/apps/operations/sync-and-recovery.mdx`.

Ownership caveat: an app registration belongs to one workspace (its owner); only the owner can `dev`/`plan`/`apply`, others can only install.
Source: publishing.mdx, lines 18-32. The `installApplication` resolver only checks the `APPLICATIONS` permission and looks up the registration (`packages/twenty-server/src/engine/core-modules/application/application-install/application-install.resolver.ts`), and the docs provide a cross-workspace share link for private apps, so installing into the other two brand workspaces should work; confirm in the build phase. Operator alternative: flag the registration `isPreInstalled` and run the `install-pre-installed-apps` command (`packages/twenty-server/src/database/commands/install-pre-installed-apps.command.ts`).

Seed data, two ways:

- **Post-install hook** (`definePostInstallLogicFunction`): runs after the schema exists, has `CoreApiClient`, 300 s default timeout, async with 3 retries (or `shouldRunSynchronously: true`). Not run by `yarn twenty dev`; trigger with `yarn twenty dev:function:exec --postInstall`.
  Source: `packages/twenty-docs/developers/extend/apps/config/install-hooks.mdx`. Precedent: `packages/twenty-apps/internal/real-estate/src/logic-functions/post-install.ts` seeds people, properties, showings and opportunities.
  Drawback here: the same code runs in every workspace, so per-brand data would need branching inside the hook.
- **External seed script** (better fit for three brands and for the "reset and reseed" question): a Node script per brand using the brand's API key against `/graphql`, `createXs(data: [...], upsert: true)`, batches of up to 60 records. Upsert matches on unique fields, so re-running is safe.
  Source: `packages/twenty-server/src/engine/api/graphql/workspace-schema-builder/utils/get-resolver-args.util.ts` (`upsert` arg on createOne/createMany); `packages/twenty-docs/developers/extend/api.mdx` ("Batch operations", "Rate limits"); `packages/twenty-docs/user-guide/data-migration/how-tos/import-data-via-api.mdx` (import order: companies, people, opportunities, then custom objects).
  Rate limit defaults are 100 requests/min and are env-configurable on self-host: `API_RATE_LIMITING_SHORT_LIMIT`, `API_RATE_LIMITING_LONG_LIMIT`, `API_RATE_LIMITING_LONG_TTL_IN_MS` (`packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts`).

Reset note: uninstalling an app removes its metadata and data (install-hooks.mdx, "Uninstall hook"), which drops the app's custom objects and their rows. Records seeded into standard objects (people, companies) are presumably not removed; not verified. A reseed script with upsert plus explicit deletes is the safer reset.

### Option B: Metadata API directly

`/metadata` (GraphQL) or `/rest/metadata` with a workspace API key: create/update/delete objects, fields and relations; same API backs Settings > Data Model.
Source: `packages/twenty-docs/developers/extend/capabilities/apis.mdx`, "Metadata API". Per-workspace schema docs live in Settings > API & Webhooks.
Use it for what the app cannot do (relabel/deactivate standard objects and fields, make standard fields unique). Downside: no stable identifiers, diff, or plan; the script must be written idempotently by hand.

### Not suitable

- `workspace:seed:dev` / `data-seed-dev-workspace.command.ts`: dev fixture seeding with fixed workspaces, not a custom-data tool.
- `workspace:export` (`packages/twenty-server/src/database/commands/workspace-export/workspace-export.command.ts`): exports a workspace as SQL INSERTs. Could snapshot a seeded workspace, but it is a raw DB path, not a supported import.

## 3. What still needs the UI (or a user session)

- **Creating the three workspaces.** Requires `IS_MULTIWORKSPACE_ENABLED=true` (default `false`, `config-variables.ts`) and a signed-in user calling `signUpInNewWorkspace` (`packages/twenty-server/src/engine/core-modules/auth/auth.resolver.ts`). Scriptable only by driving the user auth flow; plan on doing it by hand once per brand.
- **First API key per workspace.** Docs describe Settings > APIs & Webhooks; a `createApiKey` mutation exists (`packages/twenty-server/src/engine/core-modules/api-key/api-key.resolver.ts`) but needs a user token, not an API key. Do by hand once, store in the deploy env.
- **Inviting members and assigning roles to them**: Settings > Members (roles themselves can be app-declared).
- **Workflows** (round-robin assignment, commission triggers): no `define*` entity in `packages/twenty-sdk/src/sdk/define/`. Build in the UI, or implement the logic as app logic functions with database-event triggers instead (`packages/twenty-docs/developers/extend/apps/logic/logic-functions.mdx`).
- Auto-upgrade toggle per installed app (app General tab), if wanted.

## Open points for the build phase

- Confirm `app:install` of a private tarball into a non-owner workspace succeeds on this fork.
- Decide phone matching: unique `PHONES` primary number with fixed `+98` calling code, or a separate normalized `TEXT` field with a unique index.
- Decide whether per-brand data models differ; if they do, one app per brand (each owned by its brand workspace) avoids the ownership caveat.
