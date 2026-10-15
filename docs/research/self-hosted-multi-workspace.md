# Self-hosted multi-workspace on Twenty

Research for issue #5, feeding map #4 (one self-hosted deployment, one workspace per brand: Gerami, Kifpool, Proopco).

Sources are this fork's code and docs at commit `44ca3bf585`. The self-host docs under `packages/twenty-docs/developers/self-host/` are the source of https://docs.twenty.com/developers/self-host/capabilities/setup and https://docs.twenty.com/developers/self-host/capabilities/docker-compose. Where docs and code disagree, the code is stated and the gap is flagged.

## Answer in short

- Set `IS_MULTIWORKSPACE_ENABLED=true` in `.env` and restart. Each workspace then lives on its own subdomain (`gerami.<domain>`, `kifpool.<domain>`, `proopco.<domain>`); sign-up and login happen on `DEFAULT_SUBDOMAIN` (default `app`). Needs a wildcard DNS record and a wildcard TLS cert.
- The first user ever to sign up becomes server admin. With `IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS=true` (the code default), only that admin can create the other workspaces; everyone else joins by invitation.
- Up to 5 workspaces are allowed without an `ENTERPRISE_KEY`. Three brands fit.
- API keys and webhooks are rows in the shared `core` schema keyed by `workspaceId`; an API key token resolves to exactly one workspace. Each brand gets its own key and webhooks.
- CRM records live in one Postgres schema per workspace (`workspace_<base36 id>`) inside one database. Isolation is enforced by the application, not by Postgres roles or row-level security.
- Stock `docker-compose.yml` (server, worker, postgres 16, redis) is enough. Plan 2 vCPU / 4 GB RAM / 40 GB SSD for the demo.

## 1. Env flags

| Variable | Default | Effect | Source |
|---|---|---|---|
| `IS_MULTIWORKSPACE_ENABLED` | `false` | Turns on multi-workspace and subdomain routing. Env-only, restart required (not editable in admin panel). | `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts` (line ~2084); `packages/twenty-docs/developers/self-host/capabilities/setup.mdx` "Multi-Workspace Mode" |
| `DEFAULT_SUBDOMAIN` | `app` | Subdomain for sign-up/login and for the "no workspace yet" front URL. Only validated when multi-workspace is on. | `config-variables.ts` (line ~1157); `core-modules/domain/domain-server-config/services/domain-server-config.service.ts` (prefixes it to `FRONTEND_URL`) |
| `FRONTEND_URL` / `SERVER_URL` | none | Base domain. Workspace URL is built as `<subdomain>.<frontend hostname>`. | `core-modules/domain/workspace-domains/services/workspace-domains.service.ts` `getTwentyWorkspaceUrl` |
| `IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS` | `true` in code | Only users with `canAccessFullAdminPanel` may create more workspaces; sign-up without a pending invitation or approved access domain is refused. | `config-variables.ts` (line ~565); `core-modules/auth/services/sign-in-up.service.ts` `assertWorkspaceCreationAllowed`, `assertSignUpWithoutWorkspaceAllowed`; `core-modules/auth/utils/get-sign-up-without-workspace-decision.util.ts` |
| `ENTERPRISE_KEY` | none | Without a valid key the instance caps at 5 workspaces. | `core-modules/auth/constants/max-workspaces-without-organization-key.constants.ts` (`MAX_WORKSPACES_WITHOUT_ENTERPRISE_KEY = 5`); `sign-in-up.service.ts` `assertWorkspaceCountWithinLimit` |
| `AUTH_COOKIE_ALLOWED_ORIGINS`, `AUTH_COOKIE_SAME_SITE` | | With multi-workspace, do not list every subdomain; route `/graphql`, `/metadata`, `/rest`, `/auth/`, `/client-config`, `/file` to the backend on each workspace hostname so each stays same-origin. | `setup.mdx` lines ~395-416 |
| `EMAIL_DRIVER` | `logger` | Invitation emails are only logged until SMTP is configured. | `config-variables.ts` (line ~508) |

"Default workspace": there is none in multi-workspace mode. `getDefaultWorkspace()` throws when `IS_MULTIWORKSPACE_ENABLED` is true; in single-workspace mode it returns the latest workspace and warns if more than one exists (`workspace-domains.service.ts` lines 67-90). Requests are resolved to a workspace from the origin subdomain or a custom domain.

DNS: wildcard `*.your-domain.com -> server-ip` (`setup.mdx` "DNS Configuration for Multi-Workspace"). The reverse proxy (Caddy/nginx, not in the stock compose) must terminate TLS for the wildcard and forward to port 3000.

Fork note: commit `8faa7e9bc0` bypasses the enterprise check only in development and test (`core-modules/enterprise/services/enterprise-plan.service.ts`). A production VPS still needs a key for more than 5 workspaces or enterprise features (SSO, audit logs, row-level permissions).

## 2. Creating workspaces and inviting members

1. First sign-up on `app.<domain>` creates workspace 1. That user gets `canAccessFullAdminPanel` and `canImpersonate` because no server admin exists yet (`sign-in-up.service.ts` `hasServerAdmin`, `shouldGrantServerAdmin` around lines 734 and 920).
   - Docs gap: `setup.mdx` says multi-workspace mode has "no automatic admin privileges". The current code grants server admin to the first user whatever the mode.
2. The server admin creates the other two workspaces from the same account (allowed by `assertWorkspaceCreationAllowed` while under the 5-workspace cap). A subdomain can be requested at creation and is validated by `subdomainManagerService.validateSubdomainOrThrow`; it can also be changed later in workspace settings.
3. Members: per workspace, Settings > Members, `sendInvitations` mutation (`core-modules/workspace-invitation/workspace-invitation.resolver.ts`). Alternative is the public invite link (`workspace.inviteHash`, `isPublicInviteLinkEnabled` in `core-modules/workspace/workspace.entity.ts`). Invitees can sign up even with creation restricted, because a pending invitation counts as a provisioned destination (`hasProvisionedDestination`).
4. One user can belong to several workspaces (`userWorkspace` join), so the demo operator can switch between brands; brand staff should only be invited to their own.

## 3. Per-workspace API keys and webhooks

- `ApiKeyEntity`: table `core.apiKey`, indexed on `workspaceId` (`core-modules/api-key/api-key.entity.ts`). Created with a `roleId` (`api-key.service.ts`), so each key carries a workspace role.
- API key auth: the JWT `sub` is the workspace id; the key `jti` must be present, not revoked and not expired in that workspace's `apiKeyMap` (`core-modules/auth/strategies/jwt.auth.strategy.ts` `validateApiKey`). A Gerami key cannot read Kifpool.
- `WebhookEntity`: table `core.webhook`, indexed on `workspaceId`, with `targetUrl`, `operations`, and a per-webhook `secret` for signing (`metadata-modules/webhook/entities/webhook.entity.ts`).
- Delivery: `call-webhook-jobs.job.ts` loads webhooks from the event batch's `workspaceId` only, so events never fan out across workspaces.
- Keys and webhooks are created in each workspace's Settings > APIs & Webhooks. For the mock backend, use one key and one webhook per brand.

## 4. Data isolation at the database level

- One Postgres database (`PG_DATABASE_URL`, default `default`).
- `core` schema: shared tables for users, workspaces, `userWorkspace`, API keys, webhooks, metadata. Rows carry `workspaceId`.
- Per workspace: a dedicated schema `workspace_<uuidToBase36(workspaceId)>` holding all CRM records (people, companies, opportunities, custom objects) (`engine/workspace-datasource/utils/get-workspace-schema-name.util.ts`; created in `engine/workspace-datasource/workspace-schema.service.ts`).
- The ORM addresses tables as `"<schemaName>"."<table>"` from the request's workspace context (`engine/twenty-orm/repository/workspace-repository.ts`).
- No Postgres roles, `SET ROLE`, or row-level security per workspace (no matches in `packages/twenty-server/src`). All workspaces share one DB user. Isolation is schema-per-tenant enforced by the server, which matches "no cross-brand view in the CRM" but is not a DB-permission boundary: anyone with DB credentials sees every brand.
- Verify on a running instance with the read-only Postgres MCP: `select id, subdomain from core.workspace;` then `select schema_name from information_schema.schemata where schema_name like 'workspace_%';` should show three schemas.

## 5. docker-compose layout

`packages/twenty-docker/docker-compose.yml` and `.env.example`:

- `server` (`twentycrm/twenty:${TAG}`, port 3000, runs migrations and cron registration, healthcheck `/healthz`)
- `worker` (same image, `yarn worker:prod`, migrations and cron disabled) runs jobs including webhook delivery
- `db` (`postgres:16`, volume `db-data`)
- `redis` (`--maxmemory-policy noeviction`)
- shared volume `server-local-data` for `STORAGE_TYPE=local`

Multi-workspace needs no extra service. Add to `server` and `worker` environment: `IS_MULTIWORKSPACE_ENABLED`, `DEFAULT_SUBDOMAIN`, `FRONTEND_URL` (the compose file only passes the listed variables through, so new ones must be added under `environment:`), plus SMTP vars if invites should be emailed. Put a reverse proxy with wildcard TLS in front. Install via `packages/twenty-docker/scripts/install.sh` or by hand per `docker-compose.mdx`.

## 6. VPS size

- Documented minimum: 2 GB RAM (`packages/twenty-docs/developers/self-host/capabilities/docker-compose.mdx` "System Requirements").
- Load drivers for this demo: two Node processes (server and worker), Postgres with three workspace schemas, Redis. A few hundred records per brand is negligible data; memory is dominated by the Node processes and metadata caches, which grow per workspace.
- Recommendation: 2 vCPU, 4 GB RAM, 40 GB SSD. 2 GB works but leaves no headroom during image pulls, migrations, or the live "simulate" event bursts. This is an estimate from the stack composition, not a published Twenty figure.

## Open points for the spec

- Decide the base domain and whether to use custom domains per brand (custom domain support exists but is optional).
- Decide whether SMTP is real for the demo or invites are shared via public invite link.
- If more than 5 workspaces or enterprise features are ever needed in production, an `ENTERPRISE_KEY` is required.
