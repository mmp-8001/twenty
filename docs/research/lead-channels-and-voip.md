# Real integration paths for lead channels and VoIP

Research for issue #9, feeding the CRM demo map (#4). Question: how a Telegram bot or channel, Instagram DMs, web forms, and a VoIP system (Asterisk/Issabel or an Iranian cloud PBX) would feed leads and call logs into Twenty for real. The demo mocks these channels; this is the "real path" section of the spec.

Sources, highest trust first: this fork's code at `44ca3bf585`, the docs shipped in `packages/twenty-docs`, the Telegram Bot API reference, the Asterisk documentation, the Simotel and Bale developer docs. Meta's developer site returns HTTP 451 / TLS failures from the research machine (itself a symptom of the Iran constraint below), so Meta facts come from search snippets of Meta's own pages and are marked as such. Paths are relative to `packages/` unless they start with `docs/`.

## Short answer

- Twenty has no native Telegram, Instagram or telephony integration. The bundled apps (`twenty-apps/public/`: Slack, Teams, Discord, call-recorder for video meetings, ...) do not cover these channels. Every path is "something POSTs JSON to Twenty".
- Twenty already offers three entry points, so no new server code is needed in Twenty itself:
  1. **Workflow webhook trigger** (no code): `POST /webhooks/workflows/:workspaceId/:workflowId`, then workflow steps Find / Create / Upsert / Update record.
  2. **REST or GraphQL API** with a per-workspace API key (`Authorization: Bearer <key>`).
  3. **A Twenty app logic function** on an `httpRoute` (served under `/s/`), which can read forwarded headers to verify a provider's signature.
- Per channel:
  - **Web forms**: post the form server-side to the REST API or to a workflow webhook. Easiest and fully real.
  - **Telegram bot**: real and cheap. Bot asks for the user's phone with a `request_contact` button, which gives the phone match the map needs. Channels do not expose subscribers; use join-request invite links to turn channel joiners into bot conversations. Telegram is filtered in Iran, so the bot's webhook receiver must run where it can reach `api.telegram.org`. Bale (Iranian messenger) exposes a near-identical bot API as a domestic fallback.
  - **Instagram DMs**: the official API (Instagram messaging via Meta, webhooks on `messages`, 24-hour reply window, Meta app review) is the only sanctioned path, and Meta's terms bar commercial use by parties located in US-embargoed countries. An Iran-domiciled brand has no compliant direct path. Realistic options: a non-Iranian legal entity owns the Meta app (legal question, not technical), or agents log DM leads manually through a short in-CRM or web form. Do not build on unofficial Instagram scraping libraries.
  - **VoIP**: Asterisk-based PBXs (Issabel, Simotel) can POST call events directly. Asterisk: a dialplan hangup handler with `CURL()` posting to Twenty, or a small AMI/ARI listener for richer events. Simotel (Nasimtel, Iranian) ships native webhooks (`IncomingCall`, `Cdr`, ...) and a CDR search API.
- Lead matching by phone: Person `emails` is unique, `phones` is not. Normalize phones to E.164 in whatever posts the data, then Find Records by `phones.primaryPhoneNumber` and branch, or create a unique text field on the lead object for the normalized phone and use Upsert.
- One security gap to plan around: the workflow webhook trigger UI offers "API key" authentication, but the server controller does not enforce it in this fork. Treat webhook URLs as secrets or put a verifying relay in front.

## Twenty entry points

### Workflow webhook trigger

- Route: `engine/core-modules/workflow/controllers/workflow-trigger.controller.ts` (in `twenty-server/src/`) exposes `POST` and `GET` at `webhooks/workflows/:workspaceId/:workflowId` (`ApiPath.Webhooks = 'webhooks'`, `twenty-shared/src/types/ApiPath.ts`). The workflow must be published (`lastPublishedCoreWorkflowVersionId`), otherwise it returns an invalid-status error.
- Trigger settings (`twenty-shared/src/workflow/schemas/webhook-trigger-schema.ts`): `httpMethod` GET or POST, `expectedBody` sample JSON that becomes `{{trigger.body.*}}` variables, `authentication: 'API_KEY' | null`.
- Authentication gap: the controller uses `PublicEndpointGuard, NoPermissionGuard` and never reads `settings.authentication`. The only references to `'API_KEY'` for this setting are the type (`modules/workflow/workflow-trigger/types/workflow-trigger.type.ts`) and the front-end selector (`twenty-front/src/modules/workflow/workflow-trigger/constants/WebhookTriggerAuthenticationOptions.ts`). So at this commit, anyone holding the URL can run the workflow.
- Available record actions include `CREATE_RECORD`, `FIND_RECORDS`, `UPDATE_RECORD`, `UPSERT_RECORD` (`twenty-shared/src/workflow`). Upsert delegates to the common API's conflict detection on unique fields (`engine/core-modules/record-crud/services/upsert-record.service.ts`).
- User docs: `twenty-docs/user-guide/workflows/how-tos/connect-to-other-tools/set-up-a-webhook-trigger.mdx` (lists web forms and n8n/Zapier/Make as intended uses; its example URL shape `webhooks/workflow/...` is outdated, the code uses `webhooks/workflows/<workspaceId>/<workflowId>`).
- Brand = tenant fits naturally: each brand workspace gets its own workflows, hence its own URLs.

### REST / GraphQL API

- `twenty-docs/developers/extend/api.mdx`: core API at `/rest/` and `/graphql/`, `Authorization: Bearer YOUR_API_KEY`, batches up to 60 records, GraphQL batch upsert.
- API keys are per workspace and can hold a role (see `docs/research/roles-and-permissions.md` on branch `research/roles-and-permissions`), so each brand's relay gets a key scoped to lead and call objects only.
- Phone shape (`twenty-shared/src/types/FieldMetadataDefaultValue.ts`): `primaryPhoneNumber`, `primaryPhoneCountryCode`, `primaryPhoneCallingCode`, plus additional phones. Person `emails` is `isUnique: true` (`engine/workspace-manager/twenty-standard-application/utils/field-metadata/compute-person-standard-flat-field-metadata.util.ts`); `phones` is not.

### App logic function on an HTTP route

- `twenty-docs/developers/extend/apps/logic/logic-functions.mdx`: `httpRouteTriggerSettings { path, httpMethod, isAuthRequired, forwardedRequestHeaders }`, served under `<server-url>/s`, workspace resolved from the request host. `forwardedRequestHeaders` lets the handler read e.g. `x-telegram-bot-api-secret-token` and reject unsigned calls, which closes the webhook auth gap above.
- `serverRouteTriggerSettings` is for one URL shared by many tenants; it needs the app claimed and installed on an owner workspace. Not needed here: each brand registers its own bot/PBX URL.
- Reference implementation shape: `twenty-apps/public/discord`, `twenty-apps/public/teams` (bot apps with route-triggered logic functions).

## Web forms

Real path, no mock needed:

- Website backend (or a serverless function) receives the form, normalizes the phone, and calls `POST /rest/<leadObject>` with the brand's API key. Keeps the key off the browser.
- No-code alternative: point the form backend at the brand's workflow webhook URL, with the auth gap above in mind (never post to it from browser JavaScript, the URL would leak).
- Typeform-style hosted forms: `twenty-docs/user-guide/workflows/how-tos/connect-to-other-tools/bring-typeform-submissions-in-twenty.mdx` shows the same webhook pattern.

## Telegram

Source: https://core.telegram.org/bots/api (Bot API 10.3, August 2026).

- Delivery: `getUpdates` (long polling) or `setWebhook`, mutually exclusive; undelivered updates are kept at most 24 hours. Webhook ports 443, 80, 88, 8443. `setWebhook` accepts `secret_token`; Telegram then sends header `X-Telegram-Bot-Api-Secret-Token` on every call.
- Phone capture: `KeyboardButton.request_contact` sends the user's phone as a contact, private chats only. This is what makes a Telegram lead matchable by phone later.
- Channels: a bot gets `channel_post` only as admin, and `chat_member` updates only as admin with them listed in `allowed_updates`. There is no subscriber list. For lead capture, create invite links with `creates_join_request: true` (`createChatInviteLink`); each join emits `chat_join_request` with `user_chat_id`, which the bot can message for 5 minutes while the request is pending, enough to send the contact-request button. Needs the `can_invite_users` admin right.
- Hosting constraint: Telegram is filtered in Iran. If the VPS sits in Iran it cannot reach `api.telegram.org`; run the receiver (or a tiny relay that long-polls and forwards to Twenty) on a host outside Iran. Verify on the actual VPS before committing.
- Domestic fallback: Bale's bot API "is based on the Telegram Bot API with minor changes" at `https://tapi.bale.ai/bot<token>/METHOD`, so the same receiver code mostly works (https://docs.bale.ai/).
- Existing tool option: n8n's Telegram Trigger node (https://docs.n8n.io/nodes/n8n-nodes-base.telegramTrigger) plus an HTTP Request node to Twenty, if the brands want no custom code at all. One trigger per bot.

Minimal flow: `/start` with a deep-link payload (campaign source) -> bot asks for contact -> receiver posts `{ source: "telegram", campaign, phone, name, telegramUserId }` to Twenty -> workflow finds or creates the lead, round-robin assigns.

## Instagram DMs

- Official path (from search snippets of Meta pages, could not be fetched directly): Instagram professional account, a Meta app using the Instagram API (with Instagram Login or via Messenger Platform), permission `instagram_business_manage_messages` (Instagram Login) or `instagram_manage_messages` (Facebook Login), webhooks field `messages`, verification by echoing `hub.challenge` against `hub.verify_token`. Replies allowed inside a 24-hour window; the `HUMAN_AGENT` tag extends that for human support replies (third parties say 7 days). Advanced access needs Meta app review.
  - https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api
  - https://developers.facebook.com/docs/instagram-platform/webhooks
  - https://developers.facebook.com/docs/messenger-platform/instagram
- Iran constraint: Meta's terms prohibit users located in a US-embargoed country from commercial activity on Meta products unless authorized by law (Meta Commercial Terms, as tracked at https://conductatlas.com/platform/meta/meta-commercial-terms/embargo-country-commercial-activity-prohibition/; primary text at https://www.facebook.com/legal/commercial_terms could not be fetched). Meta's FY2025 10-K also notes access restrictions in Iran (https://www.sec.gov/Archives/edgar/data/1326801/000162828026003942/meta-20251231.htm). Practically: business verification and app review for an Iran-domiciled business are not available, and Meta's developer site is not even reachable from Iranian networks.
- Options, in order of preference:
  1. A non-Iranian legal entity of the group owns the Meta app and the Instagram business account. Then the flow is standard: webhook -> receiver (or Twenty app `httpRoute` that answers the GET challenge) -> Twenty. This is a legal/compliance decision, out of scope for engineering.
  2. An existing inbox product that already passed Meta review, e.g. Chatwoot (self-host needs your own Meta app, so same constraint; cloud needs a Meta-supported jurisdiction) (https://www.chatwoot.com/hc/user-guide/articles/1744361165-how-to-setup-an-instagram-channel-via-instagram-login).
  3. Manual capture: agents who answer DMs log the lead (handle, phone, campaign) via a short form or directly in Twenty. Zero compliance risk, and still produces the same lead record and phone match.
- Avoid: unofficial Instagram private-API libraries. They break Meta's terms and get accounts banned.

For the spec: describe option 1 as the real path, option 3 as the fallback the brands can use today.

## VoIP

### Asterisk / Issabel

Issabel is an Asterisk distribution, so Asterisk's interfaces apply.

- Simplest real path, no extra service: attach a hangup handler to calls and POST with `CURL(url,post-data)` (POST when `post-data` is given) and `CURLOPT(httpheader)` for `Content-Type: application/json` and an auth header. Hangup handlers run whenever the channel hangs up, wherever it is in the dialplan.
  - https://docs.asterisk.org/Latest_API/API_Documentation/Dialplan_Functions/CURL/
  - https://docs.asterisk.org/Latest_API/API_Documentation/Dialplan_Functions/CURLOPT/
  - https://docs.asterisk.org/Configuration/Dialplan/Subroutines/Hangup-Handlers/
  - Payload from channel variables: caller ID, dialed extension (agent), `CDR(duration)`, `CDR(billsec)`, `CDR(disposition)`, `UNIQUEID`, recording filename.
- Richer path (screen pop, ringing state, queue events): a small listener on AMI (TCP 5038, `manager.conf`, `cdr_manager` for `Cdr` events) or ARI (REST plus WebSocket at `/ari/events`; newer releases can open outbound WebSockets to the app).
  - `Cdr` event fields: Source, Destination, CallerID, Channel, DestinationChannel, StartTime, AnswerTime, EndTime, Duration, BillableSeconds, Disposition, UniqueID, UserField; only raised when `cdr_manager` is loaded (https://docs.asterisk.org/Latest_API/API_Documentation/AMI_Events/Cdr/).
  - https://docs.asterisk.org/Configuration/Interfaces/Asterisk-Manager-Interface-AMI/The-Asterisk-Manager-TCP-IP-API/
  - https://docs.asterisk.org/Configuration/Interfaces/Asterisk-REST-Interface-ARI/Getting-Started-with-ARI/
  - https://docs.asterisk.org/Configuration/Interfaces/Asterisk-REST-Interface-ARI/ARI-Outbound-Websockets/
- Lock AMI to the listener's IP; never expose 5038 publicly.

### Iranian PBX / cloud: Simotel

Simotel (by Nasimtel) documents native outbound webhooks ("Simotel Events") and an API v4 (https://simotel.com/wiki/fa/):

- Events: `IncomingCall` (number, entry_point, unique id), `OutgoingCall`, `NewState`, `Transfer`, `Cdr`, `CdrQueue`, `VoiceMail`, `Survey`, and more (https://simotel.com/wiki/fa/developers/simotelwebhooks/events/whatis/).
- `Cdr` payload: `starttime`, `endtime`, `src`, `dst`, `type` (incoming/outgoing/local), `disposition`, `duration`, `billsec`, `wait`, `record`, `unique_id`, survey fields (https://simotel.com/wiki/fa/developers/simotelwebhooks/events/cdr/).
- CDR search API for backfill: https://simotel.com/wiki/fa/developers/simotelapi/v4/report/report_cdr_search/
- Smart API lets the PBX ask an external service for routing decisions (e.g. route a known lead to its assigned agent): https://simotel.com/wiki/fa/developers/simotelwebhooks/dialplanapicomponents/smart_api/

Other Iranian cloud VoIP providers: none with public developer docs turned up. Acceptance criterion for any provider: an outbound webhook on call end (or a CDR API that can be polled) carrying caller number, agent extension, direction, disposition, duration and a unique call id. If it has that, it plugs into the same receiver.

### Call log in Twenty

- No call object exists in Twenty's standard model (`twenty-server/src/modules/` has `call-recording` for video meeting bots only). The demo needs a custom object (e.g. call log) with: direction, from/to number, agent (workspace member), disposition, duration, started at, provider call id (unique, makes retries idempotent via Upsert), recording URL, relation to the lead/person.
- Flow: PBX event -> (relay that normalizes number and maps extension to workspace member) -> Upsert call log by provider call id -> Find lead/person by phone -> link, or create a new lead with source "call".
- Extension-to-member mapping is the one piece of state the relay owns; keep it in a small config per brand.

## Recommended shape for the spec

- One small receiver per brand deployment (or one shared, routing by brand, holding each brand's API key) that: verifies the provider (Telegram secret token, Meta signature, PBX shared header), normalizes phones to E.164, and calls the brand workspace's REST API. It can live as a Twenty app logic function (`httpRoute`, verifies headers itself) or as a tiny external service; the external option is required for Telegram if the VPS is inside Iran.
- Inside Twenty: one workflow per brand that does find-or-create lead by phone and round-robin assignment, triggered by the API record-created event rather than by a public webhook, so the auth gap never matters.
- The demo's mock backend should post exactly the payloads above, so swapping mock for real is a config change.

## Open points

- Where the VPS is located (inside or outside Iran) decides whether Telegram can be reached directly.
- Whether any brand has a non-Iranian entity able to own a Meta app.
- Which PBX each brand actually runs (Issabel, Simotel, a cloud provider), to confirm its webhook fields.
- Whether to fix webhook-trigger API key enforcement upstream; it is a real bug in the trigger controller.
