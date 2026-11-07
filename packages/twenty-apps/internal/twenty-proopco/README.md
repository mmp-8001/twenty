# twenty-proopco

Private Twenty app for the proopco sales CRM. See `GLOSSARY.md` and `docs/adr/` at the repo root.

The app installs on its own: it needs neither the `twenty-sms` app nor a proopco connection. Every server variable is optional and switches its connection on once set in Settings > Applications > twenty-proopco: `PROOPCO_SYNC_TOKEN` for sync, `SMS_ENQUEUE_URL` and `SMS_ENQUEUE_TOKEN` for SMS, `PROOPCO_API_BASE_URL` and `PROOPCO_API_KEY` for the proopco API.

Installing this version removes the previous (#34) objects, views, workflows and their data. There is no migration.

## Roles

Sales Admin, Supervisor and Full Admin are assignable to workspace members. Every role reads synced data and none can update or delete it. Only the sync route writes it. Workspace members carry a CRM status (`ACTIVE`, `FROZEN`, `DEACTIVATED`) and `frozenSince`.

Exactly one Full Admin is a rule the role configuration cannot enforce; keep it by assigning the role once.

The app's own role (`Proopco CRM default role`) writes synced records. It is not assignable to users.

## Sync route

`POST /s/proopco/sync` with header `x-proopco-sync-token` (the `PROOPCO_SYNC_TOKEN` server variable). A wrong or missing token returns `{ "success": false, "error": "Invalid sync token" }`.

```json
{ "items": [{ "type": "user | account | payment", "proopcoId": "...", "data": {} }] }
```

- At most 200 items per request. A larger or non-array body is rejected as a whole with `{ "success": false, "error": "..." }`.
- Items are upserted by `proopcoId` within their type. Send the same item again and nothing changes: it reports `unchanged`. The nightly full resend is accepted the same way.
- Items are processed users first, then accounts, then payments, so one batch can carry a user and what refers to it. Results come back in input order.
- A malformed or invalid item returns `error` for that item only; the rest of the batch is applied.
- A key absent from `data` leaves the field alone. `null` clears it.
- Dates and date-times are ISO 8601 strings. `birthday` is a plain `YYYY-MM-DD`. Amounts are JSON numbers; proopco converts to toman and USDT at settlement, the CRM never converts.

### Items

| type | `data` |
|---|---|
| `user` | `firstName`, `lastName`, `email`, `phoneNumber`, `phoneCallingCode`, `signedUpAt`, `kycStatus`, `lastLoginAt`, `birthday`, `isReferral` (boolean), `hasProfitWithdrawal` (boolean), `purchaseCount`, `totalPaidUsdt`, `lastPurchaseAt`, `activeAccountCount`, `currentStage` |
| `account` | `userProopcoId` (required), `status`, `phase`, `failureReason` |
| `payment` | `userProopcoId` (required), `accountProopcoId`, `amountToman` (required), `amountUsdt` (required), `paidAt` (required) |

Account `status` must be `active` for a live account and `breached` once lost (case-insensitive). When a successful User's last `active` account stops being active, the User goes to their admin's Rebuy list.

Each payment must carry `accountProopcoId` to earn a commission: one Commission per account, 2% of `amountUsdt`. A payment settled before the User's current Ownership began is not attributed to it.

`userProopcoId` and `accountProopcoId` name records already synced; one that is missing is a retryable error.

### Request

```json
{
  "items": [
    {
      "type": "user",
      "proopcoId": "u-1001",
      "data": {
        "firstName": "Ada",
        "lastName": "Lovelace",
        "email": "ada@example.com",
        "phoneNumber": "9120000000",
        "phoneCallingCode": "+98",
        "signedUpAt": "2026-01-02T08:30:00Z",
        "kycStatus": "verified",
        "lastLoginAt": "2026-03-01T10:00:00Z",
        "birthday": "1990-05-17",
        "isReferral": false,
        "hasProfitWithdrawal": false,
        "purchaseCount": 1,
        "totalPaidUsdt": 99.5,
        "lastPurchaseAt": "2026-02-10T12:00:00Z",
        "activeAccountCount": 1,
        "currentStage": "phase1"
      }
    },
    {
      "type": "account",
      "proopcoId": "a-2001",
      "data": { "userProopcoId": "u-1001", "status": "active", "phase": "phase1", "failureReason": null }
    },
    {
      "type": "payment",
      "proopcoId": "p-3001",
      "data": {
        "userProopcoId": "u-1001",
        "accountProopcoId": "a-2001",
        "amountToman": 8500000,
        "amountUsdt": 99.5,
        "paidAt": "2026-02-10T12:00:00Z"
      }
    },
    { "type": "payment", "proopcoId": "p-3002", "data": { "userProopcoId": "u-1001", "amountUsdt": 10 } }
  ]
}
```

### Response

```json
{
  "success": true,
  "results": [
    { "type": "user", "proopcoId": "u-1001", "status": "created" },
    { "type": "account", "proopcoId": "a-2001", "status": "unchanged" },
    { "type": "payment", "proopcoId": "p-3001", "status": "updated" },
    {
      "type": "payment",
      "proopcoId": "p-3002",
      "status": "error",
      "reason": "amountToman is required and must be a number",
      "retryable": false
    }
  ]
}
```

`status` is `created`, `updated`, `unchanged` or `error`. An `error` carries `reason` and `retryable`: `true` means resend later (a referenced record is not synced yet, or the call failed transiently), `false` means the item must be fixed first. `type` and `proopcoId` are `null` when the item did not carry a valid one.

### Limits

Each item costs two to four internal API calls, and the application is limited to 500 requests per minute. Send batches well under 200 items, and send them one after another, not in parallel.
