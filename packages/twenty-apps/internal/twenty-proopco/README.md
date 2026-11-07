# twenty-proopco

Private Twenty app for the proopco sales CRM. See `GLOSSARY.md` and `docs/adr/` at the repo root.

The app installs on its own: it needs neither the `twenty-sms` app nor a proopco connection. Every server variable is optional and switches its connection on once set in Settings > Applications > twenty-proopco: `PROOPCO_SYNC_TOKEN` for sync, `SMS_ENQUEUE_URL` and `SMS_ENQUEUE_TOKEN` for SMS, `PROOPCO_API_BASE_URL` and `PROOPCO_API_KEY` for the proopco API.

Installing this version removes the previous (#34) objects, views, workflows and their data. There is no migration.

## Roles

Sales Agent, Supervisor and Full Admin are assignable to workspace members. Every role reads synced data and none can update or delete it. Only the sync route writes it. Workspace members carry a CRM status (`ACTIVE`, `FROZEN`, `DEACTIVATED`) and `frozenSince`.

Exactly one Full Admin is a rule the role configuration cannot enforce; keep it by assigning the role once.

The app's own role (`Proopco CRM default role`) writes synced records. It is not assignable to users.

## Agent management

Routes (POST, signed-in caller; identity and role come from the caller's token, never the body): `/s/proopco/freeze-admin`, `unfreeze-admin`, `transfer-users`, `release-users`, `deactivate-admin`, `admins`. Every one writes an Audit Log entry with actor and reason. Freeze, transfer, release and deactivation require a reason.

- Freeze: a Supervisor or the Full Admin freezes a Sales Agent; only the Full Admin freezes a Supervisor; nobody freezes themself or the Full Admin. Each open case stores `frozenRemainingSeconds` and loses its `deadlineAt`; the sweep skips a frozen Agent's call windows. Unfreeze restores the deadline from the remaining time and shifts open windows by the frozen time. A rebuy case created while its Agent is frozen holds its full start time until unfreeze. Purchases during a freeze still count.
- Long freeze: a daily job (and `/s/proopco/flag-long-freezes` with the sync token) sets `warnedAt` on a freeze open for 7 days and writes a `LONG_FREEZE_WARNING` audit entry. The Sales Team page shows days frozen.
- Transfer and release (Supervisor or Full Admin; the target of a transfer must be a Sales Agent): the old Ownership ends `TRANSFERRED` or `RELEASED_BY_MANAGER`, the old Followup closes (`TRANSFERRED` or `RELEASED_BY_MANAGER`) and keeps its Agent. A transfer opens a new Ownership and Followup for the target with the remaining time, open call windows, and `transferredFrom` pointing at the old case. Previous calls stay visible to the new owner through `visibleToMemberIds` on Call. Reruns skip Users already with the target; a User whose steps fail after the old Ownership closed is reported as `ERROR` and needs a manual look.
- Deactivation: Full Admin only, refused while the Agent owns Users. It sets the CRM status only; it does not remove the login or the platform role.
- Audit Log is append-only: no assignable role can update or delete an entry, and Sales Agents cannot read it. The app role writes it, so the rule for the app's own role is enforced in code.
- The routes read member roles through the metadata API, so the app role carries the `ROLES` and `WORKSPACE_MEMBERS` permission flags.

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

Account `status` must be `active` for a live account and `breached` once lost (case-insensitive). When a successful User's last `active` account stops being active, the User goes to their agent's Rebuy list.

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

## Offers and SMS

- The Full Admin creates Offers (title, capability, parameters, one fixed expiry); a Supervisor only links existing Offers to a Campaign (Campaign Offer). Rebuy and retention sets are Offer Set records; the rebuy values stay application variables. There is no combined Settings page yet.
- After an answered call the form shows the case's offers: the Campaign's, the rebuy set or the retention set. Activation (`/proopco/activate-offer`, also the Retry route) creates one Offer Activation per offer and user, calls the code service, then queues the SMS with the `twenty-sms` app. "SMS not sent" means the enqueue failed, not that delivery failed; Resend is safe because the SMS app dedups on `offer-activation:<id>`.
- Server variables: `CODE_SERVICE_PROVIDER` (`http` calls `PROOPCO_API_BASE_URL` `POST /crm/offer-codes` with `{ userProopcoId, capability, params, expiresAt }` and expects `{ id, code }`, an assumed contract until #39; `fake` invents codes; unset refuses), `SMS_ENQUEUE_URL`, `SMS_ENQUEUE_TOKEN`.
- A payment sync item may carry `offerCode`; when it matches an ACTIVE activation of that user, the activation becomes USED and counts for the activating admin.
- Deactivating an Offer (`/proopco/deactivate-offer`, Full Admin) voids its activations in the CRM only; it does not call proopco to void the code.

## Monthly income and reports

- Monthly Income (one per Agent and Jalali month, unique `incomeKey`) is written by the app only. `proopco-create-monthly-incomes` is a logic-function cron every 5 minutes that does work only on a Jalali day 1 in Tehran time (00:00 Tehran is 20:30 UTC, which a Gregorian cron cannot express); `/s/proopco/create-monthly-incomes` with the sync token and `{ referenceDate }` runs it for the month before that date. It links the previous month's unassigned Commissions (by `purchasedAt`) and re-sums the total from the linked Commissions, so a rerun creates nothing and a crash heals on the next run. A PAID income is never reopened; a Commission that arrives for it later stays unlinked. This is a cron logic function, not an app-shipped workflow, like the long-freeze job.
- `/proopco/mark-income-paid` (Full Admin; conditional PENDING to PAID, writes `INCOME_PAID`). Sales Agents read only their own Commissions and incomes (row-level predicate on `admin`).
- `/proopco/my-report` is always the caller's own numbers (the body names a period, never an Agent). `/proopco/team-report` (Supervisor, Full Admin) returns team totals, every Agent ranked by name, long freezes and pending incomes. Periods: daily, weekly (Saturday start), the current Jalali month, all-time. Events count on their own date (RPT-03); freeze days are subtracted from working days for a bounded period. Both are computed live from the event tables; add a daily aggregate table if they get slow.
- The Reports page shows both; the Monthly incomes, Commissions and History (closed cases) views are role-scoped lists. No role has the CSV export flag.
- Not done: History does not show each user's current state; the management dashboard is a page, not a Twenty dashboard.

## Known limits

- A Sales Agent cannot read Challenge Accounts, Payments, Offer Activations or Call Feedback Reasons directly (no row rule can scope them to a User); User details read accounts and offers through `/proopco/person-details`, which answers only for Users the caller's own token can see.
- Search never explains an owned User: once a User is owned it leaves every non-owner's visibility list (S3, OWN-07). The Add to follow-up route still answers OWN-07 for an owned User id, which a Sales Agent cannot learn from the UI. Showing OWN-07 for an in-scope owned User needs a stored match list that survives ownership.
- Freeze is a read then an update on the member, so two simultaneous freezes of one Agent can write two AdminFreeze rows; unfreeze closes the newest open one first and a retry closes the rest.
- The Call button shows for non-owners (the route refuses them), and queue rows have no inline Call button.
- Relative-date segment weeks start on Monday; the Iranian week starts on Saturday (reports use Saturday).
- The job routes (recompute visibility, sweep, monthly incomes, long freezes) take a `referenceDate`; they require the sync token, and tests need the date to drive them.
- The demo seed never freezes a real member, so the frozen-agent case is not seeded; use Freeze on a demo-owning Agent.
