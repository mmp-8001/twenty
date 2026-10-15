# Twenty workflows, webhooks and dashboards

Research for issue #7 (map #4, Persian CRM demo). Question: which workflow triggers and actions exist in this fork and their limits; whether a workflow can do round-robin assignment, compute a commission from related records, or detect inactivity on a schedule; which outbound webhooks exist; and what charts can show per-employee and per-stage totals.

Fork baseline: synced with upstream `twentyhq/twenty` up to commit `516d49a7f6` (2026-09-26), `TWENTY_CURRENT_VERSION = '2.43.0'` (`packages/twenty-server/src/engine/core-modules/upgrade/constants/twenty-current-version.constant.ts`). The fork's own commits (Persian locale, enterprise features on in dev/test) do not touch workflows, webhooks or dashboards, so everything below is upstream code that ships in this fork. Nothing below is roadmap-only unless marked so.

Doc citations point to `packages/twenty-docs/`, the source of https://twenty.com/developers and https://twenty.com/user-guide.

## Short answer

- Triggers: record event (created, updated with optional watched fields, deleted, upserted, plus restored/destroyed), manual, cron schedule, inbound webhook (GET or POST, optional API key).
- Actions: create, update, delete, upsert, search records (max 200), pick record (random, round robin, load balanced), filter, if/else branches, iterator (loops), delay, form, HTTP request, code, logic function, send/draft email, create calendar event, AI agent, classify.
- Round robin: built in. The Pick Record action has a `ROUND_ROBIN` strategy and a `LOAD_BALANCED` strategy (least related records).
- Commission: no formula or rollup field type exists. Compute it with Search Records + Code action, then Update Record. The Code action needs `LOGIC_FUNCTION_TYPE=LOCAL` (or `LAMBDA`) on a production VPS; it is disabled by default.
- Inactivity: cron trigger + Search Records with a relative date filter ("updated before today minus N days") + iterator + create Task. Official how-to exists.
- Outbound webhooks: per workspace, subscribe to `object.action` patterns with wildcards, HMAC SHA-256 signed, 5 s timeout, no retry on non-2xx. Private IPs blocked unless `OUTBOUND_HTTP_ALLOWED_INTERNAL_HOSTS` lists the host (matters for a mock backend on the same VPS).
- Dashboards: bar, line, pie, aggregate number widgets. Group by a relation (e.g. owner = workspace member) and by date (month etc.), aggregate SUM/COUNT/AVG/MIN/MAX. Per-employee and per-stage totals work. Dashboards are not private, have no dashboard-level filter, and bucket dates by Gregorian month, not Jalali.

## Triggers

Source: `packages/twenty-server/src/modules/workflow/workflow-trigger/types/workflow-trigger.type.ts`.

| Trigger | Settings | Notes |
|---|---|---|
| `DATABASE_EVENT` | `eventName` like `person.created`; update triggers take optional `fields` (watched fields) and a record `filter` | Actions from `DatabaseEventAction`: created, updated, deleted, destroyed, restored, upserted (`packages/twenty-server/src/engine/api/graphql/graphql-query-runner/enums/database-event-action.ts`). Field and filter matching: `workflow-trigger/automated-trigger/listeners/workflow-database-event-trigger.listener.ts` (`eventMatchesWatchedFields`, `eventMatchesRecordFilter`). Events are gated by the standard app's role row-level permissions. |
| `MANUAL` | `objectType`, availability global / single record / bulk records, `isPinned` | Shows as a button in the record or command menu. |
| `CRON` | `DAYS`, `HOURS`, `MINUTES` presets or `CUSTOM` cron pattern | Evaluated by a job that ticks every minute (`WORKFLOW_CRON_TRIGGER_CRON_PATTERN = '* * * * *'` in `automated-trigger/crons/jobs/workflow-cron-trigger-cron.job.ts`), so minute resolution. Needs the worker running. |
| `WEBHOOK` | GET, or POST with `expectedBody`; `authentication: 'API_KEY' \| null` | Endpoint `POST/GET /webhooks/workflows/:workspaceId/:workflowId` (`packages/twenty-server/src/engine/core-modules/workflow/controllers/workflow-trigger.controller.ts`). This is the ingestion path for the mock backend. |

Docs: `packages/twenty-docs/user-guide/workflows/capabilities/workflow-triggers.mdx` (https://twenty.com/user-guide/workflows/capabilities/workflow-triggers).

## Actions

Source: `packages/twenty-shared/src/workflow/types/WorkflowActionType.ts`, implementations under `packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/`.

| Group | Actions |
|---|---|
| Records | `CREATE_RECORD`, `UPDATE_RECORD`, `DELETE_RECORD`, `UPSERT_RECORD`, `FIND_RECORDS` (UI: Search Records), `PICK_RECORD` |
| Flow | `FILTER` (stop if condition fails), `IF_ELSE` (branches), `ITERATOR` (loop over a list), `DELAY` (duration or scheduled date), `EMPTY`, `FORM` (pause for human input) |
| Integration | `HTTP_REQUEST` (GET/POST/PUT/PATCH/DELETE, headers, JSON body), `CODE`, `LOGIC_FUNCTION` |
| Communication | `SEND_EMAIL`, `DRAFT_EMAIL` (need a connected mailbox), `CREATE_CALENDAR_EVENT` |
| AI | `AI_AGENT`, `CLASSIFY` (need an AI provider configured) |

Creating a Task for an agent is just `CREATE_RECORD` on the Task object. Note the docs' caveat that Task/Note relations are many-to-many and "not yet available in workflow triggers or actions" (`user-guide/workflows/how-tos/crm-automations/display-related-record-data.mdx`), so linking the task to the customer may need the API or a Code step; assignee (a plain relation) is fine.

## Limits

| Limit | Value | Source |
|---|---|---|
| Search Records page size | 200 max (`QUERY_MAX_RECORDS`) | `packages/twenty-shared/src/constants/QueryMaxRecords.ts`, `record-crud/utils/resolve-limit-input.util.ts`; docs `workflow-actions.mdx` |
| Iterator | 10,000 iterations | `workflow-actions/iterator/iterator.workflow-action.ts` (`MAX_ITERATIONS`) |
| Run enqueue soft throttle | 100 runs per 60 s per workspace; excess stays "Not Started" and drains later | `WORKFLOW_EXEC_SOFT_THROTTLE_LIMIT/TTL` in `packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts`; `workflow-runner/workflow-run-queue/workspace-services/workflow-throttling.workspace-service.ts`; docs `workflow-triggers.mdx` |
| Run hard throttle | 5,000 runs per hour per workspace, then `WORKFLOW_RUN_LIMIT_REACHED` | same files |
| Logic function throttle | 1,000 per 60 s | `LOGIC_FUNCTION_EXEC_THROTTLE_LIMIT/TTL`, same config file |
| Delay | scheduled date in the past fails the run | docs `workflow-actions.mdx` |
| Credits | Metered only when feature flag `IS_EXECUTION_QUOTA_ENABLED` is on (billing). Not a concern for a self-hosted demo. | `workflow-executor/workspace-services/workflow-executor.workspace-service.ts` |
| Code action runtime | `LOGIC_FUNCTION_TYPE` defaults to `DISABLED` outside `NODE_ENV=development`. `LOCAL` runs unsandboxed on the host; `LAMBDA` needs AWS. | `config-variables.ts`; `packages/twenty-docs/developers/self-host/capabilities/setup.mdx` |

All throttles are env-configurable on self-host.

## Can a workflow do the three demo jobs?

### Round-robin lead assignment: yes, built in

`PICK_RECORD` (`workflow-actions/record-crud/pick-record.workflow-action.ts`, input type in `record-crud/types/workflow-pick-record-action-input.type.ts`) takes `objectName`, a list of candidate `recordIds` and a strategy:

- `ROUND_ROBIN`: a Redis counter keyed `pick-record:round-robin:<workspaceId>:<stepId>` with a 90-day TTL; candidates are sorted by id, then `(counter - 1) % count`.
- `LOAD_BALANCED`: groups a related object by a relation field and picks the candidate with the fewest records (e.g. fewest open leads per owner).
- `RANDOM`.

Shape for the demo: trigger on `lead.created` (or the inbound webhook) → Pick Record over workspace members (or a custom Agent object) → Update Record `owner = picked`. Manager reassignment is just editing the owner field. Caveats: the cursor lives in cache, so flushing Redis (e.g. during demo reset) restarts the rotation; candidates are a fixed id list in the step, so adding an agent means editing the workflow. Landed upstream June 2026 (#21899, #21900, #21902).

### Commission from related records: yes, with a Code step

There is no formula, rollup or computed field type (`packages/twenty-shared/src/types/FieldMetadataType.ts` has no such entry), and workflow variables do no arithmetic. Pattern:

1. Trigger: record event (e.g. conversion milestone created) or monthly cron.
2. Search Records for the related records (≤ 200 per call; filter tightly or iterate).
3. Code action computes the amount (plain TypeScript `main(params)`).
4. Create/Update a Commission record (CURRENCY field) linked to the employee.

Requires `LOGIC_FUNCTION_TYPE=LOCAL` on the VPS. For synthetic data and trusted, self-written code that is acceptable; the docs warn LOCAL has no sandbox. Alternative without code: let the mock backend compute it and push it through the webhook trigger, but the map says the CRM calculates commission, so the Code step is the honest path.

### Inactivity on a schedule: yes

Cron trigger daily → Search Records with a relative date filter (`IS_RELATIVE` operand, `packages/twenty-shared/src/types/ViewFilterOperand.ts`, resolved in `packages/twenty-shared/src/utils/filter/dates/utils/resolveDateTimeFilter.ts`) such as "last activity before today minus 30 days" → Iterator → Create Task assigned to the owner (or Send Email / HTTP Request to an SMS gateway). Official recipe: `packages/twenty-docs/user-guide/workflows/how-tos/crm-automations/detect-stale-opportunities.mdx` (https://twenty.com/user-guide/workflows/how-tos/crm-automations/detect-stale-opportunities). Needs a "last activity" date field kept current by the sync, since `updatedAt` moves on any edit. 200 per search caps one run; schedule more often or narrow the filter if a brand has more stale customers than that.

## Outbound webhooks

Module: `packages/twenty-server/src/engine/metadata-modules/webhook/`. Docs: `packages/twenty-docs/developers/extend/webhooks.mdx` (https://twenty.com/developers/extend/webhooks).

- Scope: one webhook config per workspace (fits brand = tenant), managed in Settings or via GraphQL/REST and AI tools (`webhook.resolver.ts`, `tools/`). Entity has `targetUrl`, `operations: string[]`, `secret` (`entities/webhook.entity.ts`).
- Events: record events `<object>.<action>` with wildcards `*.created`, `person.*`, `*.*` (`utils/compute-webhook-operations-to-match.util.ts`); `workflowRun.updated` is excluded from wildcards. Metadata events are also sent (`jobs/call-webhook-jobs-for-metadata.job.ts`).
- Payload: `eventName`, `objectMetadata {id, nameSingular}`, `record` (after state, or before for deletes), `updatedFields`, `workspaceId`, `webhookId`, `eventDate`, `workspaceMemberId` (`types/webhook-job-data.type.ts`, `utils/transform-event-to-webhook-event.ts`).
- Security: when a secret is set, headers `X-Twenty-Webhook-Timestamp`, `X-Twenty-Webhook-Signature` = HMAC-SHA256 of `timestamp:JSON(body)`, `X-Twenty-Webhook-Nonce` (`jobs/call-webhook.job.ts`).
- Delivery: POST, 5,000 ms timeout. HTTP errors are caught and logged as a response event, so a non-2xx or timeout is not retried (`retryLimit: 3` on the queue job only covers job crashes). Optional per-workspace rate limit behind `IS_WEBHOOK_RATE_LIMIT_ENABLED` (`jobs/webhook-rate-limit.service.ts`). Receivers should be idempotent and the demo should not rely on redelivery.
- SSRF guard: webhooks and the HTTP Request action go through `SecureHttpClientService` (`packages/twenty-server/src/engine/core-modules/secure-http-client/secure-http-client.service.ts`), which blocks private and loopback addresses. A mock backend on the same VPS or Docker network must be listed in `OUTBOUND_HTTP_ALLOWED_INTERNAL_HOSTS` (exact hostnames, or `*`), see `config-variables.ts`.
- Workflows can also call out directly with `HTTP_REQUEST`, for event-specific payloads instead of raw record webhooks.

## Dashboards and charts

Server: `packages/twenty-server/src/engine/metadata-modules/page-layout-widget/` (DTOs per chart type, `enums/graph-type.enum.ts`). Front: `packages/twenty-front/src/modules/page-layout/widgets/graph/` (bar, line, pie, aggregate). Docs: `packages/twenty-docs/user-guide/dashboards/` (https://twenty.com/user-guide/dashboards/overview).

- Chart types: `AGGREGATE_CHART` (single number), `BAR_CHART` (vertical/horizontal, stacked or grouped, cumulative), `LINE_CHART`, `PIE_CHART`. Also record table, iframe and other widgets. Gauges are roadmap only (docs `widgets.mdx`).
- Aggregates: COUNT, SUM, AVG, MIN, MAX, count unique/empty/not empty/true/false, percentage empty/not empty (`packages/twenty-shared/src/types/AggregateOperations.ts`).
- Grouping: primary and secondary group-by on any groupable field, including relations (group by `ownerId`, or a nested subfield) and dates at DAY, WEEK, MONTH, QUARTER, YEAR, plus day-of-week / month-of-year (`bar-chart-configuration.dto.ts`, `packages/twenty-front/src/modules/page-layout/widgets/graph/utils/buildGroupByFieldObject.ts`, `packages/twenty-shared/src/types/ObjectRecordGroupByDateGranularity.ts`). Each widget has its own record filter.
- Per-employee totals: bar chart on Commission, SUM(amount), primary axis = employee relation, secondary = date by MONTH. Per-stage totals: bar or pie on Lead/Opportunity, COUNT or SUM(amount) grouped by the stage SELECT field. Both supported today.
- Limits: 100 bars, 50 groups per bar (docs `widgets.mdx`); 5 distinct group colors before reuse (`GRAPH_MAXIMUM_NUMBER_OF_GROUP_COLORS`).
- Gaps (docs `dashboards-faq.mdx`): no private dashboards (every workspace member sees all dashboards), no dashboard-level filter (filter each widget), no export, numbers follow the viewer's timezone. A "my numbers" view per employee means one widget or dashboard per employee filtered by name, or relying on record-level permissions; whether charts honour row-level permission predicates was not verified here.
- Calendar: month buckets come from Postgres date truncation (`packages/twenty-server/src/engine/api/common/common-query-runners/utils/get-group-by-expression.util.ts`), so they are Gregorian months. The `fa` locale's Jalali display does not change bucketing. For Jalali-month commission reports, store a Jalali period field (e.g. TEXT or SELECT `1405-07`) on the Commission record and group by that.

## Open points for the spec

- Decide `LOGIC_FUNCTION_TYPE=LOCAL` for the VPS (needed for commission Code step).
- Add the mock backend host to `OUTBOUND_HTTP_ALLOWED_INTERNAL_HOSTS`.
- Add a Jalali period field on Commission for monthly reporting.
- Demo reset must account for the round-robin cursor living in Redis.
