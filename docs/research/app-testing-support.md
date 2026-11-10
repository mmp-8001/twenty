# What testing support do Twenty apps have?

Research ticket: mmp-8001/twenty#81 (part of #61). Inputs: #64, #72, #79.
Sources: this repo at `204821bbbc` (paths relative to repo root) and the official app testing doc that ships in it (`packages/twenty-docs/developers/extend/apps/operations/testing.mdx`). Vitest behavior is from the Vitest API docs (`vi.setSystemTime`).

## Summary

- The SDK ships **no test utilities**. Testing an app means Vitest plus the real CLI plus the typed API clients, all pointed at a live Twenty server.
- Integration tests use a global setup that runs `twenty app apply --create` (and `twenty app uninstall --yes` on teardown) against a live instance. Browser e2e (postcard, media-notes) is plain Playwright against the live front end, with a login setup project.
- The **deployed function runtime has no controllable clock**. To get one, run the handler in the test process with `vi.setSystemTime`, after turning the deployed cron trigger off so it can't race the test. Public apps in this repo already do this.
- **Concurrency** works with a plain `Promise.all` over `fetch` or client calls. Each execution runs in its own child process, and the only limit is a per-workspace token bucket (1000 per 60s by default).
- A **front component on a dashboard** can be render-checked with Playwright, the same way postcard checks its record-page widget. No example does it on a dashboard yet, so the test has to create the Dashboard record itself.

## 1. Test utilities the SDK gives apps

- `twenty-sdk` exports only `billing`, `define`, `front-component`, `logic-function`, `utils`, `front-component-renderer` and `front-component-renderer/build` (`packages/twenty-sdk/package.json` `exports`). None is a test helper. `front-component-renderer` exports three host constants, and `/build` exports esbuild plugins (`packages/twenty-sdk/src/front-component-renderer/index.ts`, `.../build/index.ts`).
- The real renderer, with its stubs and fixtures, is `packages/twenty-front-component-renderer` (`src/testing/*`, Storybook plus `playwright.layout.config.ts`). It is `"private": true` (its `package.json`), so it is internal and apps can't install it.
- What apps actually get comes from the scaffold and the docs (`testing.mdx`):
  - a `vitest.config.ts` that sets `TWENTY_API_URL` and `TWENTY_API_KEY`, runs with `fileParallelism: false`, includes `src/**/*.integration-test.ts` and uses `globalSetup`;
  - `src/__tests__/run-twenty.ts`, which spawns the global `twenty` CLI with `--json` and parses `{ ok, data | error }` (copy at `packages/twenty-apps/examples/postcard/src/__tests__/run-twenty.ts`; `TWENTY_CLI` overrides the binary);
  - the typed clients `twenty-client-sdk/core` and `twenty-client-sdk/metadata`, which read `process.env.TWENTY_API_URL` (`packages/twenty-client-sdk/src/metadata/generated/index.ts:192`);
  - `twenty app typecheck`;
  - a scaffolded GitHub workflow that boots an ephemeral server through `.github/actions/spawn-twenty-app-dev-test`.
- `defineX(...)` returns `{ success, errors, config }`, so a unit test can check manifest validity and reach the raw handler through `.config.handler`. Examples: `packages/twenty-apps/public/last-contact/src/logic-functions/__tests__/on-meeting-slot-reached.test.ts` and `packages/twenty-apps/public/call-recorder/src/__tests__/record-page-widgets.test.ts`, which asserts `errors` is empty and `isHeadless` is not true.
- **To run a deployed function:** `twenty app exec --name <fn> --payload <json>` (`packages/twenty-cli/src/commands/app/exec/*`), or the metadata mutation `executeOneLogicFunction` that it calls. Both **need a user token**:
  - the CLI refuses anything that isn't OAuth (`run-app-exec-command.ts`, "API keys cannot execute them");
  - the resolver uses `@AuthUser()` (`packages/twenty-server/src/engine/metadata-modules/logic-function/logic-function.resolver.ts:286-300`).

  The postcard CI job passes a seeded `type: ACCESS` user JWT as `TWENTY_API_KEY` (`.github/workflows/ci-example-app-postcard.yaml`). The vitest default in the example configs is an `API_KEY` token, which can't execute functions.

## 2. How example apps run e2e against a live instance

**Integration (Vitest):** `packages/twenty-apps/examples/postcard/vitest.config.ts` and `src/__tests__/global-setup.ts` do four things:
1. Check `GET ${TWENTY_API_URL}/healthz`.
2. Uninstall any leftover install.
3. Run `twenty app apply --create`.
4. Run `twenty app uninstall --yes` on teardown.

Tests then query metadata or data with the clients (`schema.integration-test.ts`). CI (`.github/workflows/ci-example-app-postcard.yaml`):
1. Starts Postgres and Redis services.
2. Builds the SDK and CLI.
3. Runs `reset:env:e2e-testing-server` and `database:reset`.
4. Runs `nx start:ci twenty-server` and waits on `/healthz`.
5. Starts `yarn worker:prod`. The worker is needed for cron and queued jobs.
6. Runs `npx vitest run`.
7. Exercises the registry path with `app publish --private` and `app install`.

hello-world and document-generator follow the same pattern.

**Browser e2e (Playwright):** `packages/twenty-apps/examples/postcard/playwright.config.ts`:
- `baseURL = FRONT_BASE_URL ?? http://localhost:3001`, one worker;
- a `setup` project (`e2e/auth.setup.ts`) logs in with "Continue with Email" and the seeded `tim@apple.dev` user (overridable through `E2E_LOGIN`, `E2E_PASSWORD` and `E2E_WORKSPACE_NAME`), then saves `storageState` and the workspace origin;
- Chromium and WebKit projects reuse that state;
- `TZ` and `timezoneId` are pinned to `Europe/Paris`, because WebKit on Linux ignores `timezoneId`.

`e2e/card-front-component.spec.ts` then:
1. Opens `/object/postCard/${E2E_POSTCARD_RECORD_ID}`.
2. Finds the widget by `data-testid` (the ids live in `src/components/card-test-ids.ts`).
3. Asserts text and computed CSS.
4. Asserts no fallback/error text.
5. Pipes browser console, `pageerror`, failed requests and 4xx/5xx responses into the test log. Front-component failures stay inside the worker sandbox and would otherwise be invisible.

`e2e/shared-dependencies-bundle.spec.ts` inspects the served bundles through network responses. media-notes has the same layout (`packages/twenty-apps/examples/media-notes/e2e`).

**Note:** no workflow in this repo runs the Playwright suites. The seeded record ids come from env, and `app-prod-parity-e2e-dispatch.yaml` hands prod-parity e2e off to an external repo. Locally you run `yarn test:e2e` yourself against `yarn start`.

`packages/twenty-e2e-testing` is the core product's Playwright suite (login, records, workflows). It has no app or dashboard helpers. Only its login flow is reusable as a pattern.

## 3. Logic functions and cron triggers under a controlled clock

**In the deployed runtime: no.**
- The local driver spawns `node --permission ... runner` per execution (`.../logic-function-drivers/drivers/local/utils/build-local-child-process-node-flags.util.ts`). The child env is an allowlist (`PATH`, `HOME`, `LANG`, `TZ`, `NODE_ENV`, proxies, CA vars) plus the function env, and **`NODE_OPTIONS` is stripped** (`build-local-child-process-env.util.ts`, `drivers/local/constants/local-driver.constant.ts`). So there's no `--require`/`--import` hook for faking `Date`.
- The executor shim is a fixed file (`.../constants/executor/index.mjs`).
- The only clock-related knob is `TZ`, which comes from the server host.
- Lambda has none either.

**Cron dispatch uses the server wall clock:**
- `CronTriggerCronJob.handle()` runs every minute (`* * * * *`) on the worker. It does `const now = new Date()`, then dispatches a function when `cron-parser`'s `prev()` for its pattern falls inside the last 60s. A Redis lock deduplicates per tick (`.../logic-function-trigger/triggers/cron/cron-trigger.cron.job.ts`, `packages/twenty-server/src/engine/core-modules/cron/services/cron-trigger-deduplication.service.ts`).
- No `tz` option is passed, so patterns are read in the worker process's timezone.
- The job payload is always `{}`, so the scheduled time is never handed to the handler.

**What works:**
1. **Run the handler in the test process with a fake clock.** Import the handler (or `default.config.handler`), stub the env the runtime would inject (`TWENTY_APP_ACCESS_TOKEN`, app variables) with `vi.stubEnv`, then `vi.setSystemTime(...)`. Without `useFakeTimers` this mocks only `Date.*` (and `Temporal.Now` in Vitest 5), so real network I/O to the live server still works.

   Reference: `packages/twenty-apps/public/call-recorder/src/__tests__/call-recorder-lifecycle.integration-test.ts`. Around lines 920-945 it stubs the env and the token. Around line 1385 it moves the clock to each follow-up's `dueAt` and calls the handler. It also calls the cron handler (`convergeDivergedCallRecordings`) directly, as a "mocked job queue". This is "invoke the cron's handler directly".
2. **Stop the real cron from racing the test.** `.../call-recorder/src/__tests__/disable-automatic-triggers-or-throw.ts` takes the manifest from `twenty app build --json`, nulls `cronTriggerSettings` and `databaseEventTriggerSettings`, re-syncs it with the `syncApplication` metadata mutation, then confirms the triggers are gone. It runs from `global-setup.ts`.
3. **Inject `now` as a parameter.** `packages/twenty-apps/public/fathom/src/__tests__/media-import-ownership.integration-test.ts` passes `now` into `claimFathomMediaImport`. A cron handler can default to `new Date()` and accept an override from the payload, since the cron sends `{}` while `twenty app exec --payload` can send `{ now }`. An app variable also reaches the function as an env var (`getExecutionEnvVariables` in `.../logic-function-executor/logic-function-executor.service.ts`), but that would be a test-only switch in prod code.
4. **Pure unit tests:** `vi.useFakeTimers()` with `setSystemTime` is common across the public apps (`grep -rl setSystemTime packages/twenty-apps/public`).

**Limits:**
- Rows the server writes still get real `createdAt`, `updatedAt` and `deletedAt`, and any DB-side `now()` uses real time. A fake clock moves only the app's own `Date` reads.
- Logic that compares app time with server timestamps needs a seam for that.

## 4. Firing truly concurrent requests at an app route or command

- **Routes:** a function with `httpRouteTriggerSettings.path` is served at `${TWENTY_API_URL}/s/<path>` (`ApiPath.RouteTrigger = 's'` in `packages/twenty-shared/src/types/ApiPath.ts`, `packages/twenty-server/src/engine/metadata-modules/route-trigger/route-trigger.controller.ts`). Registered server routes live under `/webhooks/server/<applicationRegistrationId>/...` (`server-route-trigger.controller.ts`).
- With `isAuthRequired`, the bearer token is validated, and agent/MCP tokens are refused (`.../triggers/route/route-trigger.service.ts:252-330`).
- Fire N requests with `Promise.all(Array.from({ length: N }, () => fetch(url, { method: 'POST', headers, body })))` from Vitest. Node's fetch opens parallel connections.
- **Commands:** a command-menu item runs its logic function through the same executor. From a test, either call `executeOneLogicFunction` N times in `Promise.all` with a user token, or call the in-process handler concurrently.
- Examples of concurrent tests against a live server:
  - `.../fathom/src/__tests__/media-import-ownership.integration-test.ts:45` (two claims race, exactly one wins);
  - `.../fathom/src/__tests__/call-recording-title.integration-test.ts:118` ("allows only one concurrent worker");
  - `.../slack/src/__tests__/slack-agent-tools.integration-test.ts:294`.

  These race through the core API, which is where the #72 conditional `UPDATE ... RETURNING` atomicity lives.
- **Server side it really is parallel:** each execution assembles its own temp dir and spawns its own child process, with no per-function lock (`drivers/local.driver.ts` `execute`, around lines 220-330). The only gate is a per-workspace token bucket of `LOGIC_FUNCTION_EXEC_THROTTLE_LIMIT = 1000` per `LOGIC_FUNCTION_EXEC_THROTTLE_TTL = 60_000` ms (`logic-function-executor.service.ts:409`, `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts:763-772`). Above that it fails with `RATE_LIMIT_EXCEEDED`.
- Keep `fileParallelism: false`. The concurrency belongs inside one test, not across files that share a workspace.

## 5. Render-checking a front component placed on a dashboard

**Yes with Playwright, nothing off the shelf.**
- Dashboards and record pages share the widget renderer. `FrontComponentWidgetRenderer` lazily loads `FrontComponentRenderer` for `FrontComponentConfiguration` widgets, whatever the layout type (`packages/twenty-front/src/modules/page-layout/widgets/front-component/components/FrontComponentWidgetRenderer.tsx`).
- `PageLayoutType` includes `DASHBOARD` (`packages/twenty-shared/src/types/page-layout/PageLayoutType.ts`), and an app manifest can ship one (#79).
- The `Dashboard` record (`title`, `pageLayoutId`) is workspace data that the manifest does not create.

A test can do this:
1. `app apply` the app, with a DASHBOARD page layout holding the FRONT_COMPONENT widget. Alternatively, build one with the metadata mutations `createPageLayout`, `createPageLayoutTab` and `createPageLayoutWidget` (`packages/twenty-server/src/engine/metadata-modules/page-layout*/resolvers/*.resolver.ts`, which need page-layout write access).
2. Create a Dashboard record with that `pageLayoutId` through the core API.
3. In Playwright, open `/object/dashboard/<id>` (`AppPath.RecordShowPage = '/object/:objectNameSingular/:objectRecordId'`) and assert on the component's `data-testid` elements, using postcard's `card-front-component.spec.ts` as the template. Keep its console, pageerror and response logging so sandbox failures show up.

Steps 2-3 are inferred from the code and not yet run on a dashboard, so #79's "checked statically only" risk stays open until someone runs one.

**Cheaper layer:** render the component's React tree in jsdom with `@testing-library/react` and mock `twenty-sdk/front-component` (`packages/twenty-apps/public/teams/src/front-components/components/__tests__/TeamsSettings.test.tsx`, `// @vitest-environment jsdom`). This tests logic and markup, not the worker sandbox or the remote-dom bridge. The partial DOM and unscoped-CSS limits from #64 only show up in the browser.

## Open / unverified

- A Dashboard record created through the core API with an app-shipped `pageLayoutId` was not run end to end. The postcard e2e is the only live front-component render check in the repo.
- The `/s/<path>` route URL comes from the controller and `ApiPath`. No integration test in the repo hits app routes over HTTP concurrently. The examples race the core API or in-process handlers.
