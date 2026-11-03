# twenty-proopco

Private Twenty app for the proopco sales CRM. See `GLOSSARY.md` and `docs/adr/` at the repo root.

The app installs on its own: it needs neither the `twenty-sms` app nor a proopco connection. Every server variable is optional, and each connection switches on once its variables are set in Settings > Applications > twenty-proopco: `PROOPCO_SYNC_TOKEN` for sync, `SMS_ENQUEUE_URL` and `SMS_ENQUEUE_TOKEN` for Campaigns, `PROOPCO_API_BASE_URL` and `PROOPCO_API_KEY` for Gift discount code. Until then those routes refuse with an error naming the missing variables.

## Sync route

`POST /s/proopco/sync` with header `x-proopco-sync-token` (the `PROOPCO_SYNC_TOKEN` server variable).

```json
{ "items": [{ "type": "trader | tradingAccount | payment", "proopcoId": "...", "data": {} }] }
```

Max 200 items. Items run in order trader, tradingAccount, payment; results come back in input order as
`created | updated | unchanged | error` (`error` carries `reason` and `retryable`). A missing referenced Trader or
Trading Account is a retryable error. A field absent from `data` is left alone; `null` clears it.

| type | `data` |
|---|---|
| trader | `firstName`, `lastName`, `email`, `phoneNumber`, `phoneCallingCode`, `purchaseCount`, `totalSpentUsd`, `lastPurchaseAt`, `isVip`, `source`, `labels[]`, `referredByProopcoId` |
| tradingAccount | `traderProopcoId` (required), `status`, `failureReason`, `phase` |
| payment | `traderProopcoId` (required), `tradingAccountProopcoId`, `amountUsd` (required), `kind` (required: `purchase`, `installment_initial`, `installment_remaining`), `paidAt` |

## Sales core

Followups, Commissions and Monthly Incomes. Agents claim a Trader with the Track command on the Person page (`POST /s/proopco/track`).

Jobs also exposed as routes guarded by the same `x-proopco-sync-token`, so tests and operators can run them with a chosen date:

| route | body | what |
|---|---|---|
| `POST /s/proopco/sweep` | `{ referenceDate? }` | expire overdue Pending Followups, pool overdue Retry Pending ones, expire overdue Pool ones (hourly cron uses the clock) |
| `POST /s/proopco/commission` | `{ paymentId }` | what the Payment-created workflow runs |
| `POST /s/proopco/monthly-income` | `{ month? }` (`YYYY-MM`, default last month) | what the monthly cron workflow runs |

Commission Tiers and Followup Types are records; `RETRY_WINDOW_DAYS`, `POOL_DAYS`, `COMMISSION_BASIS`, `COMMISSION_SCOPE` and `INSTALLMENT_REMAINING_EARNS` are app variables. `COMMISSION_BASIS=list_price` is refused until proopco syncs a list price.

The post-install hook (seeds, `activeTraderKey` backfill, deactivating Opportunity) runs on `twenty app install` and on version upgrades, not on `twenty app apply`.

## Campaigns and Gift discount code

| route (authenticated) | body | what |
|---|---|---|
| `POST /s/proopco/campaigns/send` | `{ campaignId }` | claims a Draft Campaign, resolves its Segment View (filters via the metadata API) into a Person query, posts `campaign:<id>:person:<id>` messages to `SMS_ENQUEUE_URL` (the twenty-sms enqueue route) |
| `POST /s/proopco/gift-discount` | `{ personId, code }` | `POST {PROOPCO_API_BASE_URL}/crm/gift-discount` with `{ userId, code }` and `PROOPCO_API_KEY`; proopco's error text is returned as is |

Segment operands follow what the server allows per field type; relative-date operands, `IS` on date-times and array fields are rejected with an error naming the operand. The gift endpoint path and body are assumed: proopco's real contract is not in this repo.
