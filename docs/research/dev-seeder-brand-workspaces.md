# What the dev seeder can create for the brand workspaces

Research for issue #22. Question: what can the fork's dev seeder create for three brand workspaces (Gerami, Kifpool, Proopco), and where does each piece hook in?

Everything here was read from this repo at commit `0c36db9132`. Paths are abbreviated:

- `DS/` = `packages/twenty-server/src/engine/workspace-manager/dev-seeder/`
- `SRV/` = `packages/twenty-server/src/`
- `PREFILL/` = `packages/twenty-server/src/engine/workspace-manager/standard-objects-prefill-data/`

## Summary

| Ticket item | Verdict | Where it hooks in |
| --- | --- | --- |
| Extra workspaces with members, logins, subdomains | Small addition | `DS/core/constants/seeder-workspaces.constant.ts`, `seed-users.util.ts`, `seed-user-workspaces.util.ts`, `workspace-member-data-seeds.constant.ts`, `SRV/database/commands/data-seed-dev-workspace.command.ts`. Subdomains also need `IS_MULTIWORKSPACE_ENABLED=true` |
| Workspace locale `fa`, member locale/calendar → Persian, RTL, Jalali | Member level: small addition. Workspace level: not possible | Set `locale: 'fa'` in workspace-member seeds and `userWorkspace.locale`. No workspace locale column exists |
| Custom objects, fields (select, relation, currency, unique phone), disabling Company/Opportunity | Objects and fields: possible today. Disabling: small addition | `DS/metadata/services/dev-seeder-metadata.service.ts` config map; disable via `ObjectMetadataService.updateOneObject({ isActive: false })` at the end of `seedDev` |
| Roles with object, field and row-level permissions | Object and field: possible today. Row-level: small addition | `DS/core/services/dev-seeder-permissions.service.ts`; row-level needs `RowLevelPermissionModule` imported into `DS/dev-seeder.module.ts` |
| Workflows (record, cron, manual triggers, Code steps), active after reset | Small addition | Copy the raw-SQL pattern in `PREFILL/utils/prefill-workflows.util.ts`, plus `PrefillLogicFunctionService.ensureSeeded` for the Code-step source. Cron also needs `cron:register:all` run once |
| Dashboards and views (group by, filters) | Dashboards: small addition. Views: small addition | Dashboards: `DS/core/utils/seed-page-layouts.util.ts` and widget seeds. Views: no seeder code today; `ViewService` and `ViewFilterService` or the same flat-entity migration call |
| Records with backdated `createdAt` and timeline entries | Records: small addition. Timeline: small addition | Raw inserts in `DS/data/services/dev-seeder-data.service.ts` accept any column; `DS/data/services/timeline-activity-seeder.service.ts` hardcodes `new Date()` and its entity list |

Nothing in the ticket is blocked outright except a workspace-wide locale setting. That column does not exist. Locale is per user and per member, which is enough for the demo.

## How a reset runs

- `npx nx database:reset twenty-server` runs truncate, `database:init`, `cache:flush`, then `workspace:seed:dev` (`packages/twenty-server/project.json:260-282`).
- `workspace:seed:dev` loops over a hardcoded list `[SEED_APPLE_WORKSPACE_ID, SEED_YCOMBINATOR_WORKSPACE_ID]`. With `--light` it seeds Apple only (`SRV/database/commands/data-seed-dev-workspace.command.ts:41-50`).
- **Gotcha:** the command catches and only logs any error (`data-seed-dev-workspace.command.ts:51-54`). A broken brand seed still lets the reset "pass". Check the logs.
- `DevSeederService.seedDev` runs these steps in order (`DS/services/dev-seeder.service.ts:90-240`):
  1. Core rows: workspace, users, userWorkspaces, API keys, feature flags (`:269-365`)
  2. Workspace schema and standard-app sync (`:114-137`)
  3. Custom metadata (`:149-165`)
  4. Permissions (`:167-172`)
  5. Code-step logic functions (`:201-207`)
  6. Page layouts and dashboards (`:214-220`)
  7. Record data and workflows (`:222-227`)
  8. AI chat (`:229-237`)
- Every per-workspace branch is keyed by workspace ID. For example, the metadata config map is at `DS/metadata/services/dev-seeder-metadata.service.ts:75-170`, and an unknown ID throws there (`:179-186`). The permissions branch is at `DS/core/services/dev-seeder-permissions.service.ts:89-158`, and with no admin it throws at `:154-158`. So a new workspace needs an entry in each of these branches, not just a new ID.

## 1. Extra workspaces, members, logins, subdomains — small addition

- The workspace row comes from `SEEDER_CREATE_WORKSPACE_INPUT`: id, displayName, subdomain, inviteHash, logo (`DS/core/constants/seeder-workspaces.constant.ts:34-56`). `SeededWorkspacesIds` is a closed union (`:30-32`). Add three IDs and three entries.
- Users are inserted from one hardcoded list (`DS/core/utils/seed-users.util.ts:24-100`). The bcrypt hash used for all seed users means password `tim@apple.dev` (`:31-32`), and it can be reused for brand users.
- User-to-workspace links branch on workspace ID (`DS/core/utils/seed-user-workspaces.util.ts:48-103`). Workspace members branch the same way (`DS/data/constants/workspace-member-data-seeds.constant.ts:102-120`).
- Role assignment per user is in `DS/core/services/dev-seeder-permissions.service.ts:89-177`. The workspace is flipped to `ACTIVE` in `initMinimalPermissionsAndActivateWorkspace` (`:180-200`).
- Add the three IDs to the command loop (`SRV/database/commands/data-seed-dev-workspace.command.ts:41-43`). To replace Apple and YC, drop them from that loop instead. Note that `WorkspaceDomainsService` falls back to the Apple ID in single-workspace mode (`SRV/engine/core-modules/domain/workspace-domains/services/workspace-domains.service.ts:87-90`). Without Apple it falls back to the newest workspace instead.
- **Subdomains:** `IS_MULTIWORKSPACE_ENABLED` defaults to `false` (`SRV/engine/core-modules/twenty-config/config-variables.ts:2084`). In that mode every origin resolves to one default workspace (`workspace-domains.service.ts:111-122`). Per-brand subdomains such as `gerami.localhost` need `IS_MULTIWORKSPACE_ENABLED=true` in `.env`.
- The login form pre-fills `tim@apple.dev` (`packages/twenty-front/src/modules/auth/sign-in-up/hooks/useSignInUpForm.ts:66-68`). Brand users either type their own email or this default changes.

## 2. Persian locale, RTL, Jalali — member level: small addition; workspace level: not possible

- **No workspace locale exists.** `WorkspaceEntity` has no `locale` column (grep of `SRV/engine/core-modules/workspace/workspace.entity.ts`). Locale lives on `user.locale` (`SRV/engine/core-modules/user/user.entity.ts:91-93`), on `userWorkspace.locale` (`SRV/engine/core-modules/user-workspace/user-workspace.entity.ts:68-70`, default `en`), and on the `workspaceMember.locale` record (`SRV/modules/workspace-member/standard-objects/workspace-member.workspace-entity.ts:60`).
- After login, the front end activates `workspaceMember.locale` (`packages/twenty-front/src/modules/users/hooks/useLoadCurrentUser.ts:98-106`). `dynamicActivate` sets `document.documentElement.dir` from `getLocaleTextDirection` (`packages/twenty-front/src/utils/i18n/dynamicActivate.ts:18-19`). `fa` is in `APP_LOCALES` (`packages/twenty-shared/src/translations/constants/AppLocales.ts:14`). So **`locale: 'fa'` on the member gives Persian plus RTL.**
- **Jalali is not a separate setting.** It follows the locale: `fa` loads `date-fns-jalali/locale/fa-IR` (`packages/twenty-front/src/modules/ui/field/display/utils/getDateFnsLocale.ts:27-30`), and formatters branch on `isJalaliLocale` (`packages/twenty-front/src/modules/localization/utils/isJalaliLocale.ts:7-8`).
- **Hook:** the member seeds hardcode `locale: 'en'` (`DS/data/constants/workspace-member-data-seeds.constant.ts:49`). The seed columns are `id, name, locale, colorScheme, userEmail, userId` (`:18-27`). For brand members:
  - Set `locale: 'fa'`.
  - Optionally add `calendarStartDay` (`CalendarStartDay.SATURDAY = 6`, `packages/twenty-shared/src/constants/CalendarStartDay.ts:5`) and `timeZone` to the column list. Both are member fields (`workspace-member.workspace-entity.ts:64-67`).
  - Also add `locale` to the `userWorkspace` insert (`DS/core/utils/seed-user-workspaces.util.ts:104-110`), so server-side locale (emails, `auth.service.ts:743`) matches.
- **The login page before auth** uses the URL `?locale=`, then localStorage, then the browser language (`packages/twenty-front/src/utils/i18n/initialI18nActivate.ts:6-43`). The seeder cannot control it. Use `?locale=fa` in demo links.

## 3. Custom objects and fields; disabling standard objects — objects and fields: possible today; disabling: small addition

- **Objects and fields** are declared per workspace in `workspaceConfigs` (`DS/metadata/services/dev-seeder-metadata.service.ts:53-59, 75-170`):
  - Objects go through `ObjectMetadataService.createOneObject` (`:224-235`).
  - Fields go through `FieldMetadataService.createManyFields` (`:237-265`).
  - Seeds are typed as the public `CreateObjectInput` / `CreateFieldInput` (`DS/metadata/types/*.ts`), so anything the settings UI can create can be seeded.
- **Field types already seeded:**
  - `SELECT` and `MULTI_SELECT` (`DS/metadata/custom-fields/constants/pet-custom-field-seeds.constant.ts:7,20`)
  - `CURRENCY` (`:78`)
  - `PHONES` (`:53`)
  - Morph relations (`pet-custom-relation-field-seeds.constant.ts:10`)
  - One-to-many relations and junctions (`dev-seeder-metadata.service.ts:429-466`, `:333-368`)
  - `IRR` is a valid currency code (`packages/twenty-shared/src/constants/CurrencyCode.ts:64`).
- **Unique phone:**
  - `isUnique` is part of the field input. Seeds set it (`company-custom-field-seeds.constant.ts:14`).
  - `PHONES` declares `primaryPhoneNumber`, `primaryPhoneCountryCode` and `primaryPhoneCallingCode` as part of the unique constraint (`packages/twenty-shared/src/types/composite-types/phones.composite-type.ts:9-27`).
  - `isUnique` is editable on standard fields too (`SRV/engine/metadata-modules/flat-field-metadata/constants/flat-field-metadata-editable-properties.constant.ts:18-29`). So `person.phones` can be made unique with `updateOneField`.
  - The seeded flag `IS_UNIQUE_INDEXES_ENABLED: false` (`DS/core/utils/seed-feature-flags.util.ts:7`) is only read by the admin-panel flag list (`packages/twenty-front/src/modules/settings/admin-panel/constants/SettingsAdminFeatureFlagMetadata.ts:17`), not by the server.
  - Seed data must not contain duplicate phones, or index creation fails.
- **Disabling Company and Opportunity:**
  - `isActive` is editable on standard objects (`SRV/engine/metadata-modules/flat-object-metadata/constants/flat-object-metadata-editable-properties.constant.ts:20-30`). No object validator rejects deactivation (grep of `flat-object-metadata/validators`). Call `ObjectMetadataService.updateOneObject` (`SRV/engine/metadata-modules/object-metadata/object-metadata.service.ts:278-294`).
  - **Constraint:** `seedDev` hard-requires `company` and its INDEX view for the AI-chat seed (`DS/services/dev-seeder.service.ts:181-199`).
  - `prefillWorkflows` throws without `company`, `person` and `company.domainName` (`PREFILL/utils/prefill-workflows.util.ts:122-161`).
  - The limited demo role looks up `pet`, `rocket`, `person` and `company` (`DS/core/services/dev-seeder-permissions.service.ts:264-288`).
  - So deactivate at the very end of `seedDev`, after `seedAgentChat` and before the cache flush (`dev-seeder.service.ts:229-239`). Or gate those steps by workspace. Deactivating keeps the tables, so the generic Company/Opportunity record seeds still insert harmlessly. Skipping them needs the per-workspace record config from section 7.
- Light mode empties the metadata config (`dev-seeder-metadata.service.ts:172-177`). Brand workspaces should ignore `--light`, or simply not be in the light list.

## 4. Roles with object, field and row-level permissions — object and field: possible today; row-level: small addition

- **Possible today:** `createLimitedRoleForSeedWorkspace` creates a role (`DS/core/services/dev-seeder-permissions.service.ts:247-262`). It sets object permissions with `ObjectPermissionService.upsertObjectPermissions` (`:290-311`) and field permissions with `FieldPermissionService.upsertFieldPermissions` (`:343-352`). Permission flags use `RolePermissionFlagService.upsertPermissionFlags` (`:229-235`). Assignment uses `UserRoleService.assignRoleToManyUserWorkspace` (`:114-118`). Brand roles such as sales agent or team lead copy this pattern inside a new workspace-ID branch.
- **Row-level is a small addition:**
  - `RowLevelPermissionPredicateService.upsertRowLevelPermissionPredicates` exists (`SRV/engine/metadata-modules/row-level-permission-predicate/services/row-level-permission-predicate.service.ts:155-166`).
  - It accepts `workspaceMemberFieldMetadataId`, so "owner = current member" rules work (`.../dtos/inputs/upsert-row-level-permission-predicates.input.ts:44`).
  - It is exported by `RowLevelPermissionModule` (`.../row-level-permission.module.ts:36-41`), which `DS/dev-seeder.module.ts:40-61` does not import yet. Add the import and inject the service into `DevSeederPermissionsService`.
  - **Gate:** the service throws unless the enterprise plan is valid and the RLS entitlement exists (`row-level-permission-predicate.service.ts:559-583`).
    - The enterprise check passes automatically when `NODE_ENV` is `development` or `test` (`SRV/engine/core-modules/enterprise/services/enterprise-plan.service.ts:187-193, 739-746`).
    - The entitlement passes when billing is disabled (`SRV/engine/core-modules/billing/services/billing.service.ts:76-84`).
    - So it works on a normal dev reset, but not on a production-mode demo host without an enterprise key.

## 5. Workflows with record, cron and manual triggers and Code steps, active after reset — small addition

- **Existing pattern:** `prefillWorkflows` seeds two workflows that are already **ACTIVE** after reset: a MANUAL "Quick Lead" and a DATABASE_EVENT "Create company when adding a new person" that uses CODE steps (`PREFILL/utils/prefill-workflows.util.ts:76-943`). It is called from the data seeder (`DS/data/services/dev-seeder-data.service.ts:384-390`). It writes, by raw SQL:
  - Workspace `workflow` rows with `statuses: ['ACTIVE']` and `lastPublishedVersionId` (`:179-230`)
  - Core `WorkflowEntity` rows (`:233-260`)
  - Workspace `workflowVersion` rows with `status: 'ACTIVE'` (`:836-874`)
  - Mirrored `core.workflowVersion` rows (`:876-917`)
  - A `workflowAutomatedTrigger` row for the database trigger (`:919-942`)
- **Trigger shapes:**
  - Manual: `type: 'MANUAL'` (`:262-271`). Its command-menu entry is seeded by `prefillWorkflowCommandMenuItems`, which is hardcoded to the Quick Lead version (`PREFILL/utils/prefill-workflow-command-menu-items.util.ts:49-59`).
  - Record: `type: 'DATABASE_EVENT'` with `eventName: '<object>.<action>'` (`prefill-workflows.util.ts:273-292`).
- **Code steps:**
  - Source code is registered as a logic function by `PrefillLogicFunctionService.ensureSeeded` → `createOneFromSource` (`PREFILL/services/prefill-logic-function.service.ts:17-55`). This is called in `seedDev` (`DS/services/dev-seeder.service.ts:201-207`), with source strings and deterministic uuidv5 IDs (`PREFILL/utils/prefill-workflow-code-step-logic-functions.util.ts:1-21`).
  - A CODE step references it by `logicFunctionId` (`prefill-workflows.util.ts:473-485`).
  - `LOGIC_FUNCTION_TYPE` defaults to `LOCAL` when `NODE_ENV=development` (`SRV/engine/core-modules/twenty-config/config-variables.ts:731-734`).
- **Cron:**
  - When a cron trigger is activated normally, a `workflowAutomatedTrigger` row with `type: CRON, settings: { pattern }` is written (`SRV/modules/workflow/workflow-trigger/workspace-services/workflow-trigger.workspace-service.ts:662-671`).
  - The cron job rebuilds its cache from those rows plus `lastPublishedCoreWorkflowVersionId` (`SRV/modules/workflow/workflow-trigger/automated-trigger/crons/jobs/workflow-cron-trigger-cron.job.ts:236-305`). So seeding the same row as the database-event example is enough.
  - **But** the `WorkflowCronTrigger` job is registered only by `cron:register:all` (`SRV/database/commands/cron-register-all.command.ts:42, 163`). Only the Docker entrypoint runs that (`packages/twenty-docker/twenty/entrypoint.sh:41`). Locally, run `npx nx command-no-deps twenty-server -- cron:register:all` once after a reset.
- **What to add:**
  - A per-brand workflow util modelled on `prefillWorkflows`, called after `seedRecordsInBatches`.
  - Brand definitions for `ensureSeeded`.
  - Command-menu items for each manual workflow (generalise `prefill-workflow-command-menu-items.util.ts`).
- **Gotcha:** seed records are raw `INSERT`s (`DS/data/services/dev-seeder-data.service.ts:465-485`). They emit no database events, so record-trigger workflows do not fire on seed data. They fire only for records created after the reset.

## 6. Dashboards and views — dashboards: small addition; views: small addition

- **Dashboards:**
  - A dashboard is a `dashboard` record (`DS/data/constants/dashboard-data-seeds.constant.ts:5-60`) that points at a page layout.
  - The layout, tabs, widgets and navigation-menu items are created in one `validateBuildAndRunWorkspaceMigration` call (`DS/core/utils/seed-page-layouts.util.ts:10-78`).
  - Widgets are graph configs. Bar charts accept `primaryAxisGroupByFieldMetadataId`, a secondary group-by, date granularity and `filter` (`SRV/engine/metadata-modules/page-layout-widget/dtos/bar-chart-configuration.dto.ts:46-197`). The existing seeds resolve field IDs by name (`DS/core/utils/get-page-layout-widget-data-seeds.util.ts:99-125, 155-180`).
  - The layout and widget seed getters are not keyed by workspace, so brand dashboards need their own seed constants and a workspace branch.
- **Views:**
  - The dev seeder creates no views today. The only view reference is the lookup of the standard Company INDEX view (`DS/services/dev-seeder.service.ts:189-194`). Custom objects get their default view from `createOneObject`.
  - For grouped or filtered views, call `ViewService.createOne` (`SRV/engine/metadata-modules/view/services/view.service.ts:53`), `ViewFilterService.createOne` (`.../view-filter/services/view-filter.service.ts:38`) and `ViewGroupService.createMany` (`.../view-group/services/view-group.service.ts:63`).
  - Or add `view`, `viewFilter` and `viewGroup` entries to the same flat-entity migration call. All three are migratable metadata names (`packages/twenty-shared/src/metadata/constants/all-metadata-name.constant.ts:4-14`).
  - Kanban group-by is `view.mainGroupByFieldMetadataId` (`SRV/engine/metadata-modules/view/entities/view.entity.ts:58`).
  - The view modules would need importing into `DS/dev-seeder.module.ts`.

## 7. Records with backdated `createdAt` and timeline entries — small addition

- **Records:**
  - `seedRecords` inserts with the column list each seed gives (`DS/data/services/dev-seeder-data.service.ts:465-485`). Any column, `createdAt` included, can be set. Message threads already do this (`DS/data/constants/message-thread-data-seeds.constant.ts:10, 64`). Add `createdAt` to the brand seeds' column lists.
  - **But** the batch list is global, not per workspace. Apple and YC get the same Company/Person/Opportunity rows, and tables that are absent are skipped by a self-described hack (`dev-seeder-data.service.ts:139-312, 443-451`). Brand data needs a `workspaceId` branch in `getRecordSeedsBatches`.
- **Timeline:**
  - `TimelineActivitySeederService` hardcodes the entity list (company, person, note, task, opportunity; `DS/data/services/timeline-activity-seeder.service.ts:164-170`).
  - It stamps every activity with `new Date()` for `createdAt` and `happensAt` (`:306, 330-332`).
  - It attributes everything to Tim (`:324`).
  - It only sets target columns for five standard objects (`:335-347`).
  - Brand timelines need these generalised: take `happensAt` from the seed's `createdAt`, take a member ID, and accept custom-object targets. It is skipped in light mode (`dev-seeder-data.service.ts:370-376`).
