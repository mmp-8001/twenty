# twenty-proopco

Private Twenty app for the proopco sales CRM. See `GLOSSARY.md` and `docs/adr/` at the repo root.

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
