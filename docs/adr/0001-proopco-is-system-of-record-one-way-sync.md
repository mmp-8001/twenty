# Proopco is the system of record, synced one way into Twenty

Proopco keeps ownership of users, trading accounts, challenges, payments, discount codes and the support desk. Twenty owns the sales process built on top of them. Proopco pushes changes through an outbox: a model observer writes a row, and a Horizon job upserts it into Twenty keyed on a unique `proopcoId`. A nightly reconcile job catches drift, and the first run of that job is the initial load. Twenty never reads proopco's database. Commissions are calculated from synced Payments, so a sync that drops or duplicates a payment means a wrong payout. Upserts by `proopcoId` keep retries safe.

The only writes back to proopco go through its API, for example gifting a discount code.

## Considered Options

- Twenty reading proopco's MariaDB directly: rejected, because it couples Twenty to proopco's schema and bypasses proopco's own rules.
- Proopco sending webhooks without an outbox: rejected, because a failed delivery would be lost with no retry.
- Moving the support desk (triage, presence, fair distribution) into Twenty: rejected, because Twenty has no ticketing equivalent and the desk is wired into the trader panel and the mobile API.
