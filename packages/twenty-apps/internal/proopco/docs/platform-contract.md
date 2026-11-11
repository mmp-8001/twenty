# Proopco platform <-> CRM contract, v1

Status: v1. The inbound side (section 3) is built by the CRM app exactly as written; outbound (section 4) is still a draft for the platform team. Source decisions: [Platform contract](https://github.com/mmp-8001/twenty/issues/65), [attributes](https://github.com/mmp-8001/twenty/issues/76), [old-spec diff](https://github.com/mmp-8001/twenty/issues/77), [Codes and SMS](https://github.com/mmp-8001/twenty/issues/75), [App delivery](https://github.com/mmp-8001/twenty/issues/84), spec [Proopco Sales and Retention CRM on Twenty](https://github.com/mmp-8001/twenty/issues/86) section 4.

Inbound paths, headers, money format, envelope and status codes are fixed by the built route; changing them needs a new `schemaVersion`. Anything still marked **Proposed** (outbound paths, rate limits, timeouts) was not settled in a ticket and the platform team can change it before either side builds it.

## 1. Overview

| Direction | What | Transport |
|---|---|---|
| Platform -> CRM | `contact.upserted`, `purchase.settled`, `account.last_lost` | HTTPS POST to one CRM route, HMAC-signed |
| CRM -> Platform | create code, deactivate code, activate code for user, send SMS | HTTPS calls to platform endpoints, bearer token |

The platform team builds: the event sender with an outbox, the full contact replay, the nightly snapshot resend, and the four outbound endpoints.

The platform never writes to the CRM through Twenty's own API. Everything goes through the route, so the CRM's attribution, claim release and commission logic always runs.

## 2. Shared conventions

- **HTTPS only.** JSON bodies, UTF-8, `Content-Type: application/json`.
- **Timestamps:** ISO 8601 in UTC with `Z`, millisecond precision, e.g. `2026-11-14T06:30:00.000Z`. The CRM converts to Tehran time and Jalali for display.
- **Dates without time** (birth date): `YYYY-MM-DD`, **Gregorian**. The platform converts Jalali birth dates before sending.
- **Money:** USDT as a JSON string with exactly 2 decimals, e.g. `"500.00"`. Strings avoid float rounding.
- **Identity:** a contact is matched only by `platformUserId` (string, stable forever, never reused). Phone and email are data, never keys.
- **Enums:** lowercase snake_case strings, listed per field below.
- **Unknown fields** are ignored by the receiver. Additive changes are a minor version bump.

## 3. Inbound: platform -> CRM

### 3.1 Endpoint

```
POST https://<crm-domain>/s/platform/events
```

`/s/` is Twenty's prefix for app routes. The domain is the prod CRM domain (Twenty picks the workspace from the host), given to the platform team out of band. The route is public; the signature is the only authentication.

The CRM stores every event first, then processes: up to 25 events of a request are processed before the `200`, the rest by the per-minute sweeper. Either way a `200` means stored, never processed.

### 3.2 Authentication

Headers (header names are case-insensitive):

| Header | Value |
|---|---|
| `X-Proopco-Timestamp` | Unix time in seconds when the request was signed |
| `X-Proopco-Signature` | `sha256=` + lowercase hex of `HMAC-SHA256(secret, timestamp + "." + rawBody)` |

- `rawBody` is the exact bytes sent. Sign after serializing; don't re-serialize.
- The CRM rejects a timestamp more than **5 minutes** away from its clock. Keep the sender's clock on NTP.
- The secret is a shared random string of at least 32 bytes, exchanged out of band. It is stored in the CRM as an encrypted app variable, never in a repo or env file.
- **Rotation:** a single secret, no overlap window. Change it on both sides; the outbox retries whatever fails in the gap.

Worked example, secret `test-secret`, timestamp `1794637800`, body:

```json
{"events":[{"eventId":"0b7f3c1e-6a2d-4e8a-9a51-2f1d3c9e7a10","type":"account.last_lost","schemaVersion":"1.0","occurredAt":"2026-11-14T06:30:00.000Z","data":{"platformUserId":"u_48213"}}]}
```

```
X-Proopco-Timestamp: 1794637800
X-Proopco-Signature: sha256=177ed1a6e4f054d56dd0820209dcd7f039f12247877b54069bbda770a935dee3
```

### 3.3 Envelope

Each request carries **1 to 500 events** of any mix of types:

```json
{
  "events": [
    {
      "eventId": "uuid",
      "type": "contact.upserted | purchase.settled | account.last_lost",
      "schemaVersion": "1.0",
      "occurredAt": "2026-11-14T06:30:00.000Z",
      "data": { }
    }
  ]
}
```

| Field | Rule |
|---|---|
| `eventId` | UUID, generated once by the platform when the event is created in the outbox, and reused on every retry. The CRM uses it to drop duplicates. |
| `type` | one of the three types below |
| `schemaVersion` | `"MAJOR.MINOR"`, currently `"1.0"` |
| `occurredAt` | when the thing happened on the platform, **not** when it was sent. The CRM attributes purchases and account losses by this time. |
| `data` | type-specific, below |

### 3.4 `contact.upserted`

Full snapshot of one user. The CRM keeps the newest by `updatedAt` (last write wins). Send it whenever any field below changes, after any purchase, and after any account loss.

```json
{
  "platformUserId": "u_48213",
  "updatedAt": "2026-11-14T06:30:00.000Z",
  "firstName": "Ali",
  "lastName": "Rezaei",
  "phone": "+989121234567",
  "email": "ali@example.com",
  "signupAt": "2025-03-02T10:15:00.000Z",
  "hasPhone": true,
  "country": "IR",
  "registrationSource": "website",
  "kycStatus": "confirmed",
  "birthDate": "1994-06-21",
  "activeAccountCount": 2,
  "purchaseCount": 3,
  "lastPurchaseAt": "2026-10-30T12:00:00.000Z",
  "totalPaidUsdt": "1250.00",
  "currentStage": "step_2",
  "lastChallengeFailedAt": "2026-09-01T08:00:00.000Z",
  "failedChallengeCount": 1,
  "hasProfitWithdrawal": false,
  "isReferred": true,
  "lastLoginAt": "2026-11-13T19:40:00.000Z"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `platformUserId` | string | yes | |
| `updatedAt` | timestamp | yes | platform's last change to any field here; strictly increases per user |
| `firstName`, `lastName` | string or null | yes | |
| `phone` | string or null | yes | E.164 |
| `email` | string or null | yes | |
| `signupAt` | timestamp | yes | |
| `hasPhone` | boolean | yes | |
| `country` | string or null | yes | ISO 3166-1 alpha-2 |
| `registrationSource` | enum or null | yes | `website`, `telegram`, `zoomit` |
| `kycStatus` | enum | yes | `none`, `pending`, `confirmed`, `rejected` |
| `birthDate` | date or null | yes | Gregorian, normalized by the platform |
| `activeAccountCount` | integer | yes | derived by the platform |
| `purchaseCount` | integer | yes | settled purchases, derived |
| `lastPurchaseAt` | timestamp or null | yes | derived |
| `totalPaidUsdt` | money | yes | sum of settled purchases after discount, derived |
| `currentStage` | enum or null | yes | `step_1`, `step_2`, `funded` |
| `lastChallengeFailedAt` | timestamp or null | yes | derived; from the account failure record |
| `failedChallengeCount` | integer | yes | derived |
| `hasProfitWithdrawal` | boolean | yes | withdraw count > 0 |
| `isReferred` | boolean | yes | |
| `lastLoginAt` | timestamp or null | **no** | changes on every login, so send it only in the nightly snapshot. Omitted = unchanged; `null` = never logged in. |

These are the 16 attributes Supervisors can build segments on. A new segment attribute needs one new field here (minor version bump) and one new CRM field.

`occurredAt` on the envelope equals `updatedAt` for this type.

### 3.5 `purchase.settled`

One event per settled purchase, sent once payment is final.

```json
{
  "purchaseId": "p_99120",
  "platformUserId": "u_48213",
  "amountUsdt": "450.00",
  "codeUsed": "RESET50"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `purchaseId` | string | yes | unique forever; the CRM ignores a second purchase with the same id |
| `platformUserId` | string | yes | |
| `amountUsdt` | money | yes | amount actually paid, **after** discount. Commission is 2% of this. |
| `codeUsed` | string or null | yes | the discount code text exactly as created, or null. This is how the CRM learns a code was used. |

Envelope `occurredAt` = the moment payment settled. Also send a fresh `contact.upserted` (purchase count, total paid, last purchase at).

No refunds or chargebacks in v1 (out of scope).

### 3.6 `account.last_lost`

Sent when a user's **active account count goes from 1 or more to 0**. The platform decides what "active" means; the CRM keeps no per-account records.

```json
{ "platformUserId": "u_48213" }
```

Envelope `occurredAt` = when the last active account was lost. Also send a fresh `contact.upserted` with `activeAccountCount: 0`. Don't send it when a user loses one of several accounts.

### 3.7 Responses

| Status | Meaning | Platform action |
|---|---|---|
| `200` | every event in the batch is stored (new or duplicate) | mark them delivered |
| `400` | malformed body or event | keep in the outbox, alert; needs a code fix, retrying won't help |
| `401` | bad or missing signature, stale timestamp, or the CRM secret isn't configured yet | retry with backoff, alert |
| `422` | unknown major `schemaVersion` | hold in the outbox until the CRM supports it |
| `5xx`, timeout, connection error | CRM down, upgrading (kill switch on), or overloaded | retry with backoff |

**Rule for the sender: any non-2xx keeps the events in the outbox.** Retry with exponential backoff (e.g. 30 s doubling to 1 h, then every hour), forever, and alert after 6 hours of failures. Batches are safe to resend: duplicates by `eventId` (and by `purchaseId`) are no-ops.

`200` body: `{ "accepted": 12, "duplicates": 3 }`. A 200 means stored, not processed: the CRM processes after storing and retries its own failures.

Error body (all non-2xx): `{ "error": { "code": "BAD_SIGNATURE", "message": "..." } }`.

### 3.8 Ordering, lateness and limits

- **No ordering guarantee is needed.** A purchase for a contact the CRM doesn't have yet waits until its `contact.upserted` arrives. Older snapshots lose to newer ones by `updatedAt`.
- **Late events:** send as soon as possible. The CRM waits 1 hour after a deadline before closing a deal, so events arriving within that window are attributed normally. Later ones are still applied, but flagged for manual review.
- **Rate:** at most 5 requests in flight and 600 requests per minute. The CRM's runtime allows 1000 executions per minute per workspace, shared with its own jobs. **Proposed.**
- **Timeout:** the CRM answers within 10 s; use a 30 s client timeout.

### 3.9 Replay and nightly resend

- **Initial replay (go-live):** send every user (~40k) as `contact.upserted`, 500 per request. It runs together with live push; last-write-wins handles overlaps. No historical purchases or account losses: the CRM starts empty, and every contact starts unowned.
- **Nightly resend:** every night at 03:00 Tehran (23:30 UTC), send a full snapshot of every user, `lastLoginAt` included. This heals missed profile updates. Each nightly event gets a new `eventId`.
- Purchases and account losses are never reconciled. The outbox is the only guarantee, so it must keep events until they get a 2xx.
- **Early resend on request:** after a CRM restore from backup, the CRM team asks for an immediate full resend.
- **CSV stopgap:** if push isn't ready, the first contact load can be a CSV of the same snapshot fields, imported by hand, keyed on `platformUserId`. Purchases never come by CSV; go-live waits for `purchase.settled`.

## 4. Outbound: CRM -> platform

### 4.1 Conventions

- Base URL: set in the CRM as an app variable, e.g. `https://<platform-domain>/crm/v1`. Paths below are **Proposed**.
- Auth: `Authorization: Bearer <token>`. The token is a random string the platform issues for the CRM, stored as an encrypted CRM app variable. Rotate like the HMAC secret.
- Idempotency: every call carries `Idempotency-Key: <uuid>`. The platform keeps keys for at least 30 days. The same key with the same body returns the original response without repeating the action. The same key with a different body returns `422`.
- Timeout: the CRM waits **10 s** (**Proposed**). A timeout counts as Failed in the CRM, so the platform must make a later retry with the same key safe.
- The CRM never retries automatically. A human clicks Retry, which reuses the same key.
- Error body: `{ "error": { "code": "CODE_EXPIRED", "message": "human-readable" } }`. The CRM shows `message` to its users.

### 4.2 Create code

```
POST /codes
Idempotency-Key: <uuid per create attempt>
```

```json
{
  "code": "RESET50",
  "capability": "reset",
  "expiresAt": "2026-12-21T20:29:59.000Z"
}
```

| Field | Notes |
|---|---|
| `code` | unique text, as users type it |
| `capability` | `discount`, `reset`, `two_step_payment` |
| `expiresAt` | fixed instant, the same for every user |

`201`: `{ "platformCodeId": "c_771" }`. Errors: `409` code text taken, `422` invalid. On any error the CRM creates nothing. A code's fields never change after creation; to change one, deactivate it and create a new one.

### 4.3 Deactivate code

```
POST /codes/{platformCodeId}/deactivate
Idempotency-Key: <uuid>
```

No body. `200`: `{ "deactivatedAt": "..." }`. It must invalidate the code for **every** user it was activated for. Deactivating an already deactivated code returns `200`. There is no reactivation. The CRM changes nothing on its side unless this returns `200`.

### 4.4 Activate code for user

```
POST /codes/{platformCodeId}/activations
Idempotency-Key: <CRM activation id, stable across Retry>
```

```json
{ "platformUserId": "u_48213" }
```

`200`: `{ "activatedAt": "..." }`. After it, the user can use the code until its `expiresAt`.

| Error | When |
|---|---|
| `404` | unknown user or code |
| `410` | code deactivated or expired |
| `422` | invalid request |

If the code is already active for that user, return `200` (the CRM allows one activation per user per code).

### 4.5 Send SMS

```
POST /sms
Idempotency-Key: <uuid per message>
```

```json
{
  "platformUserId": "u_48213",
  "text": "Your code RESET50 (reset) is active until 30 Azar 1405, 23:59."
}
```

The CRM writes the text from its template. The platform picks the phone number from its own records. `202`: `{ "messageId": "..." }` means accepted for sending; delivery reports are not needed in v1. Errors: `404` unknown user, `422` user has no phone.

## 5. Versioning

- `schemaVersion` `"MAJOR.MINOR"` on every inbound event.
- **Minor** (e.g. `1.1`): new optional fields only. The CRM ignores fields it doesn't know yet.
- **Major** (e.g. `2.0`): anything else. The CRM answers `422` until it supports the version, and the outbox holds the events. Coordinate a major change before sending it.
- Outbound endpoints are versioned in the path (`/crm/v1`).

## 6. Testing and go-live checklist

- [ ] Platform signs the worked example in 3.2 and gets the same signature.
- [ ] CRM team gives the platform team the prod route URL and HMAC secret; the platform team gives the CRM team the base URL and bearer token (out of band, not chat or email in plain text).
- [ ] Platform sends one test `contact.upserted` and gets `200`.
- [ ] Each outbound endpoint passes against the platform's staging, including a timeout followed by a retry with the same key.
- [ ] Initial replay runs and the CRM's Failed platform events view is empty.
- [ ] The nightly resend runs at 23:30 UTC.

## 7. Open questions for the platform team

1. **Code parameters.** Besides `code`, `capability` and `expiresAt`, what does the platform need to create a code (discount percent, which products or challenge sizes it applies to)? The CRM stores only those three fields today, so adding more is a CRM data model change.
2. **Staging.** Is there a platform staging for outbound tests? The CRM has no staging and tests against a fake server.
3. **Proposed items.** Confirm or change the outbound paths, rate limits and timeouts marked **Proposed**.
