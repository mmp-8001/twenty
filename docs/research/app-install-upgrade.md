# Installing, upgrading and rolling back an app on self-hosted Twenty

Research for issue #82 (part of #61). Question: on the self-hosted 2.58.0 prod instance (#70: Docker Compose, `LOGIC_FUNCTION_TYPE=LOCAL`), how is an app built, installed into a workspace, upgraded and rolled back? Where do its secrets live, what happens to app-owned data, and can a failed upgrade leave the workspace half-migrated?

Source: this fork's code at `204821bbbc` (twenty-server, twenty-cli and twenty-sdk are all 2.58.0) and the official docs in `packages/twenty-docs`. Server paths are relative to `packages/twenty-server/src/engine/core-modules/application/` unless they start with `packages/` or `engine/`.

## Short answer

- **Release path for prod: `twenty app publish --private --remote prod`, then `twenty app install --remote prod`.** Publish uploads a tarball and creates or updates an instance-level *registration*. Install runs a background job that applies that version to one workspace. Running `app install` again after a newer publish upgrades the workspace.
- **`twenty app apply` is the dev path.** It syncs local source straight into the workspace with no version checks, and it **never runs the pre-install or post-install hooks**. Don't use it on prod, and never mix it with publish/install on the same app.
- **Each version must be strictly higher.** Publishing the same or a lower version is rejected, and so is installing one. There is **no downgrade**. To roll back, publish the old code under a higher version number.
- **Upgrades are a manifest diff.** Anything the app owns that the new manifest no longer declares is deleted. For an object or field that means `DROP TABLE` / `DROP COLUMN`, so its data is gone. Uninstall drops everything the app owns, including app fields on standard objects.
- **The metadata and DDL step is one Postgres transaction. The install as a whole is not.** A failed upgrade does not roll back. Code files may already be overwritten, the manifest may already be applied (if a later hook failed), and the stored version stays at the old number. Re-running the install is the recovery. A failed *fresh* install uninstalls itself automatically.
- **Secrets are `applicationVariables` with `isSecret: true`.** They are stored encrypted per workspace in `core.applicationVariable`, set in Settings > Applications > the app (or through `updateOneApplicationVariable`), kept across upgrades, and injected into logic functions as `process.env.*`. Instance-wide secrets are `serverVariables` on the registration. Container env vars are not passed to app code as app config.
- **Install and upgrade happen per workspace.** The registration and its tarball are instance-wide, but each workspace has its own application row, version, variables and schema. Tarball installs default to `autoUpgrade: false`.

## Build

- `twenty app build` / `typecheck` build the manifest and bundles locally with the app's installed `twenty-sdk`. No server is involved (`packages/twenty-cli/docs/commands.md` "Build and check an app"; `packages/twenty-cli/src/app/README.md`).
- `engines.twenty` in the app's `package.json` is checked against the **workspace's completed upgrade version**, on install and on apply (`application-package/application-version-validation.service.ts` `validateWorkspaceCompatibility`; `application-install/application-install.service.ts:372-392`). Upgrade the Twenty server and its workspace before installing an app that needs a newer engine.

## Install paths

| Path | CLI | Registration `sourceType` | Hooks run | Version rules |
| --- | --- | --- | --- | --- |
| Private tarball (recommended for prod) | `app publish --private`, then `app install` | `TARBALL` | yes | strictly increasing on publish and install |
| npm / marketplace | `app publish` (npm), catalog sync, install from the UI or `app install` | `NPM` | yes | install: no same or lower version |
| Dev sync | `app apply` / `app dev` | `LOCAL` | **no** | none |

### Private tarball

1. `twenty app publish --private --remote prod` builds, packs and uploads the tarball to file storage, then calls `completeAppTarballUpload` (`packages/twenty-cli/docs/commands.md` "Publish to a private Twenty registry"; `application-registration/application-registration.resolver.ts:400-411`).
2. The server extracts and validates the tarball and creates or updates the registration, with `sourceType: TARBALL`, `isListed: false` and `ownerWorkspaceId` set to the uploading workspace (`application-registration/application-tarball.service.ts:287-395`). The version must be higher than `latestAvailableVersion` and not already published (`:523-580`, `validateVersionProgression` with `action: 'deploy'`). The size limit is `MAX_TARBALL_UPLOAD_SIZE_BYTES` (100 MiB by default, `engine/core-modules/twenty-config/config-variables.ts:722`). Publishing does **not** install anything.
3. `twenty app install --remote prod` calls `triggerInstallApplication` and waits up to 10 minutes for the job (`packages/twenty-cli/src/app/deployment/install-registered-app.ts`, `wait-for-app-install.ts`). Tarball upload has no UI. Installing from the UI also works (Settings > Applications, or the share link from My apps > Distribution, per `packages/twenty-docs/developers/extend/apps/operations/publishing.mdx`).

For a tarball registration, the package fetcher always resolves the **current** tarball and ignores any requested version (`application-package/application-package-fetcher.service.ts:108-131`). The previous tarball file is deleted unless a version record still references it (`application-tarball.service.ts:381-391`).

### npm / marketplace

The registry is `APP_REGISTRY_URL` (default `https://registry.npmjs.org`), with an optional `APP_REGISTRY_TOKEN` (`config-variables.ts:2696,2739`). A catalog cron syncs it (`MARKETPLACE_CATALOG_SYNC_CRON_ENABLED`, `application-marketplace/crons/`). This only matters for a public app, which Proopco isn't.

### Dev sync (`app apply`)

`createDevelopmentApplication` creates the application row with `sourceType: LOCAL` (`application-development/application-development.service.ts:56-100`). `syncApplication` then applies the manifest directly (`:122-300`). Two things matter for prod:

- **No hooks.** `installApplication` returns early for a `LOCAL` registration (`application-install/application-install.service.ts:122-130`), and the CLI apply path never calls an install mutation (`packages/twenty-cli/src/app/deployment/`). Seeding done by the post-install hook (#69) would not happen. The only way to run the hooks is by hand with `twenty app exec --post-install`.
- **It flips the registration to `LOCAL`.** After a sync, `syncRegistrationMetadata` rewrites the owned registration with `sourceType: LOCAL` (`application-development.service.ts:348-370`). From then on, `app install` silently does nothing (the `LOCAL` early return) and `upgradeApplication` refuses to run (`application-upgrade/application-upgrade.service.ts`, `upgradeApplicationToVersion`). A later tarball publish switches it back (`application-tarball.service.ts:532-534` accepts `LOCAL`). This is from reading the code; I didn't run it.

### Auth

- The CLI connects with `twenty auth login --url <url> --name prod` (browser OAuth) or with an API key via `--with-token` / `TWENTY_API_URL` + `TWENTY_API_KEY` (`packages/twenty-cli/docs/commands.md:88-124`).
- Permission flags required on the role behind the session or API key:
  - `MARKETPLACE_APPS` and `UPLOAD_FILE` for a private publish (`application-registration.resolver.ts:106-119`).
  - `APPLICATIONS` for install, upgrade, uninstall and app variables (`application-install/application-install.resolver.ts` write policy, `application-upgrade/application-upgrade.resolver.ts:28-41`, `application-variable/application-variable.resolver.ts:22-35`).
  - `API_KEYS_AND_WEBHOOKS` to create a registration through apply (`application-registration.resolver.ts:91-104`).
- API keys are accepted for all of the above. `app exec` (running a hook by hand) needs a signed-in user, not an API key (`commands.md` "Execute an app function").
- There are server-side commands that loop over every workspace: `application:install` (only workspaces without the app), `application:upgrade` (to the latest version everywhere) and `application:kill-switch stop|remove` (stops logic-function executions) (`application-install/commands/install-application.command.ts`, `application-upgrade/commands/upgrade-application.command.ts`, `application-stop/commands/application-kill-switch.command.ts`). They are run inside the server container.

## What an install or upgrade does

`ApplicationInstallService.installApplication` serves both a fresh install and an upgrade. It is an upgrade when an application row already exists for that workspace (`application-install/application-install.service.ts:194-200`). The whole thing runs under a per-workspace, per-app cache lock (`:148-167`). Steps, in order (`application-install/constants/application-install-steps.constant.ts`; `application-install.service.ts:351-615`):

1. **RESOLVE_PACKAGE.** Fetch and extract the tarball, and check that the manifest identifier matches the registration.
2. **Engine check** (`engines.twenty` against the workspace version), then **CREATE_APPLICATION**, which ensures the `core.application` row exists. `autoUpgrade` is set to `registration.isListed`, which is `false` for tarballs (`:427-437`).
3. **Version progression** on an upgrade: same version means `APP_ALREADY_INSTALLED`, lower means `CANNOT_DOWNGRADE_APPLICATION` (`:447-468`; `application-version-validation.service.ts` `action: 'install'`).
4. **WRITE_FILES.** Copy `package.json`, `yarn.lock`, `manifest.json` and the built logic-function and front-component files into file storage. The paths are keyed by app identifier and file path, with no version in them, so files are **overwritten in place** (`:870-918`; `application-install/utils/build-application-file-list.util.ts`).
5. **PRE_INSTALL_HOOK.** A small additive sync registers only the pre-install function, which then runs synchronously. On an upgrade it is skipped unless `shouldRunOnVersionUpgrade` is set. An error aborts the install (`:617-700`).
6. **APPLY_MANIFEST.** `ApplicationManifestApplyService.applyManifestToWorkspace` runs with `persistVersion: false`. It diffs the manifest against what the app currently owns and runs the workspace migration (details below), then upserts the app's role grant and regenerates the SDK client (`application-manifest/application-manifest-apply.service.ts:25-80`).
7. **Record the version and run POST_INSTALL_HOOK.** By default the post-install hook is **queued** (3 retries) and the new version is recorded *before* it runs, so a failing async hook does not fail the install. With `shouldRunSynchronously: true` the hook runs inline and the version is recorded only after it succeeds (`:544-571`, `:760-850`). On an upgrade the hook is skipped unless `shouldRunOnVersionUpgrade` is set (as #69 noted).
8. **FINALIZE.** Refresh the registration from the manifest (with `preventVersionDowngrade`) and warm up the logic functions (`:575-592`).

How upgrades are triggered:

- **By hand:** `twenty app install` again, the Upgrade button in Settings (`packages/twenty-front/src/modules/marketplace/hooks/useUpgradeApplication.ts`, which calls `triggerUpgradeApplication`), or `application:upgrade` in the container. All of these go through `installApplication` (`application-upgrade/application-upgrade.service.ts`, `upgradeApplicationToVersion`).
- **Automatically:** a tarball publish with a new version queues `UpgradeApplicationsJob` with `onlyAutoUpgrade: true` (`application-tarball.service.ts:370-375`; `application-registration/application-registration.service.ts:233-248`). Only workspaces with `autoUpgrade = true` and a compatible engine version are upgraded (`application-upgrade.service.ts` `findApplicationsToUpgrade`). Auto-upgrade is off for tarball installs. It can be turned on in the app's General tab (`updateApplication` `autoUpgrade`, `application-install/application-install.resolver.ts:328-350`). For a controlled prod rollout, keep it off and upgrade by hand.

## The manifest diff and what happens to data

- The diff compares the entities the app owns now ("from") with the entities the manifest describes ("to") (`application-manifest/application-manifest-migration.service.ts` `syncMetadataFromManifest`). `inferDeletionFromMissingEntities` defaults to `true` on install and upgrade (`application-manifest-apply.service.ts:31`), so **anything the app owns that the new version drops gets deleted**.
- **Removing a field** gives a delete-field action, which runs `columnManager.dropColumns` (`engine/workspace-manager/workspace-migration/workspace-migration-runner/action-handlers/field/services/delete-field-action-handler.service.ts:87-93`). **Removing an object** runs `dropTable` (`.../object/services/delete-object-action-handler.service.ts:88`). There is no deactivate-first step for app fields. The delete validator only blocks system fields, label-identifier fields and partial morph deletes (`engine/workspace-manager/workspace-migration/workspace-migration-builder/validators/services/flat-field-metadata-validator.service.ts:276-380`). The data is gone, with no trash. The docs agree: destroys "drop the table and all its rows" (`packages/twenty-docs/developers/extend/apps/operations/sync-and-recovery.mdx`).
- **To retire a field safely**, keep it declared (for example hidden or deprecated in a later version) until its data has been migrated, and only then remove it. For app variables, use `isDeprecated: true` instead of deleting the key, which keeps the stored value (`packages/twenty-docs/developers/extend/apps/config/application.mdx:56`).
- **Uninstall** (`twenty app uninstall --yes`, the UI, or `uninstallApplication`) runs these steps (`application-manifest/application-sync.service.ts:345-500`; `application-install/constants/application-uninstall-steps.constant.ts`):
  1. Runs the uninstall hook on a best-effort basis.
  2. Deletes the role grant.
  3. Deletes **every** metadata entity the app owns through a system-build migration. This includes app fields added to standard objects (such as `Person.ownerMember` from #69), app views with their UI overrides, roles and app variables.
  4. Hard-deletes the application row and its file rows in a separate transaction, then removes the storage folder (`application.service.ts:929-990`).
  5. Cleans up runtime resources.

  The registration stays, so reinstalling is possible, but the data is not coming back (`commands.md` "Uninstall an app"). Apps with `canBeUninstalled = false` refuse to uninstall (`application-sync.service.ts:364-369`).

## Rollback and partial failure

- **Workspace migration: atomic.** All actions run in one transaction on the core datasource, with `lock_timeout = 8s`. On error the transaction rolls back, each action's rollback handler runs in reverse, and the caches are invalidated (`engine/workspace-manager/workspace-migration/workspace-migration-runner/services/workspace-migration-runner.service.ts:369-540`). Workspace schemas live in the same Postgres instance, so the DDL rolls back too.
- **Deferred actions run after commit.** By default (`shouldDeferActions ?? true`, `workspace-migration-runner.service.ts:182`), index builds, foreign-key validation, workflow-run deletes and logic-function resource deletes are saved and run as jobs after the commit (`.../workspace-migration-runner/deferred-action-handlers/services/`). A sync started while they are still running is refused with `DEFERRED_WORKSPACE_MIGRATION_ACTIONS_IN_PROGRESS` (`sync-and-recovery.mdx` "Telling failures apart").
- **Install or upgrade as a whole: not atomic.** Each step commits on its own.
  - **A fresh install fails:** the catch block calls `uninstallApplication` with the hook disabled, so the workspace ends up clean (`application-install.service.ts:599-612`). Careful: with a *synchronous* post-install hook, a hook failure on first install wipes everything the install created.
  - **An upgrade fails: no rollback.** What is left depends on where it failed:
    - before APPLY_MANIFEST: old metadata, but the **new code files are already in storage** (step 4 overwrites them and nothing restores them);
    - inside APPLY_MANIFEST: the migration rolls back, so old metadata plus new files;
    - in a synchronous post-install hook: new metadata, while `application.version` still holds the old number.

    In every case the stored version is still the old one, so **re-running the same install is allowed** and is the documented recovery: it re-applies the now idempotent diff and runs the hooks again. The CLI states this directly: "There is no rollback and no automatic retry" (`commands.md` "Apply an app", which also describes the `details.outcome` values `not-started` / `partial` / `unknown` / `applied`).
- **No downgrade.** Install rejects a lower version and the tarball registry rejects a publish that isn't higher (`application-version-validation.service.ts` `validateVersionProgression`). Old tarballs are not kept as installable targets. **Rolling back means rolling forward:** check out the old source, bump the version above the bad one, publish and install. The diff then puts the old schema back. Any field the bad version added is dropped with its data, and a field the bad version dropped comes back **empty**. Take a Postgres backup (`pg_dump` of the workspace schema and `core`) before every prod upgrade. It is the only real undo for data.
- **Emergency stop without uninstalling:** `application:kill-switch stop` halts the app's logic-function runs on every workspace until `remove` (`application-stop/commands/application-kill-switch.command.ts`).

## Secrets and configuration

- **`applicationVariables`** (declared in `defineApplication`) are per workspace and stored in `core.applicationVariable`.
  - Every value is encrypted (`CHECK value LIKE 'enc:v2:%'`). `isSecret` only controls masking on reads and keeps the variable out of front components. A secret variable cannot have a default (`application-variable/application-variable.entity.ts`, check constraints; `packages/twenty-shared/src/application/applicationVariablesType.ts`).
  - On create, the stored value is seeded from the manifest `value`, which becomes `defaultValue` (`.../action-handlers/application-variable/services/create-application-variable-action-handler.service.ts:40-55`).
  - `value` is not a compared property (`toCompare: false`, `engine/metadata-modules/flat-entity/constant/all-entity-properties-configuration-by-metadata-name.constant.ts:2001-2004`), so **an upgrade never overwrites a value an operator entered**. Removing the key from the manifest deletes it.
  - Set on prod by an `APPLICATIONS` holder in Settings > Applications > app > Variables (`packages/twenty-front/src/pages/settings/applications/SettingsApplicationDetails.tsx`), or through the `updateOneApplicationVariable` mutation (`application-variable/application-variable.service.ts:133-175`). The app can also update its own values at runtime.
  - `scope: 'USER'` variables hold one value per member.
- **`serverVariables`** are declared in the manifest with no value. Values are stored encrypted on the registration (`core.applicationRegistrationVariable`, `isSecret` defaults to `true`) and filled in from My apps > the app > Config, through `updateApplicationRegistrationVariable` (`application-registration.resolver.ts:385-398`; `config/application.mdx:53`). They are instance-wide, shared by every workspace using that registration.
- **Injection:** each logic-function run gets server variables, then workspace variables, then user variables, merged in that order, plus the reserved `TWENTY_API_URL`, `TWENTY_APP_ACCESS_TOKEN`, `TWENTY_API_KEY`, `APPLICATION_ID` and others (`engine/core-modules/logic-function/logic-function-executor/logic-function-executor.service.ts:564-603`). Any variable named `TWENTY_*` is rejected at sync (`application-sync.service.ts:84-93`). With the LOCAL driver, the function runs in a child Node process whose env is built from the host env plus these variables (`.../logic-function-drivers/drivers/local/services/local-child-process-runner.service.ts:152-200`). Put app secrets in app variables, not in the Compose `.env`.

## Per workspace or per instance

- **Per instance:** the registration (identity, tarball, version history, server variables, OAuth client). A tarball registration belongs to the workspace that published it. Other workspaces can install it through the share link.
- **Per workspace:** the `core.application` row (version, `autoUpgrade`, granted capabilities), app variables, file storage and all app-owned metadata and schema. Install, upgrade and uninstall each target one workspace. The `application:*` server commands just loop over workspaces.
- The upgrade target is `registration.latestAvailableVersion`. Workspaces that haven't finished the server upgrade the engine range requires are skipped (`application-upgrade.service.ts` `findApplicationsToUpgrade`).

## Prod runbook implications

1. Release with `publish --private` + `install`. Never use `apply`/`dev` against prod.
2. Bump `package.json` on every release. Keep `engines.twenty` at or below the prod version (2.58.0 per #70).
3. Before each upgrade: `pg_dump`, then `twenty app plan --remote prod` to review destroys. `plan` needs a registration this workspace owns, which the tarball registration is. I didn't test this against a tarball install.
4. Keep `autoUpgrade` off and upgrade by hand.
5. On failure, fix the problem and re-run `twenty app install`. To roll back, publish the old code under a higher version.
6. Never remove a field or object that holds data in the same release that stops using it.
7. Set secrets once in Settings after the first install. They survive upgrades and are lost on uninstall.

## Not verified

- Nothing here was run on prod or on a local instance. It all comes from reading the code and the docs.
- I didn't check how field *type* changes or relation changes behave on upgrade (whether they alter in place or are rejected).
- I didn't check whether a logic function reads its built file from storage on every run or caches it by checksum. That decides whether a failed upgrade really runs new code against old metadata.
- Whether `app plan` works against a `TARBALL`-sourced install without flipping anything (plan uses `dryRun` and should not write).
