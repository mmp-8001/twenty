# Proopco is the system of record, synced one way into Twenty

Proopco keeps ownership of users, challenge accounts, payments, discount codes and the support desk. Twenty owns the follow-up process built on top of them. Proopco pushes changes through an outbox: a model observer writes a row, and a Horizon job posts it to the app's sync route in batches of users, challenge accounts and settled payments, upserted by a unique `proopcoId`. A nightly full resend repairs drift, and its first run is the initial load. Twenty never reads proopco's database. Purchase detection and Commissions come from synced Payments, so a sync that drops or duplicates a payment means a wrong payout. Upserts by `proopcoId` keep retries safe. Each Payment carries its USDT amount converted by proopco at settlement, so Twenty never converts currencies.

Twenty defines the sync contract and documents it in the app README; the proopco side is built against it. The only writes back to proopco go through its API, for Offer Activation.

## Considered Options

- Twenty reading proopco's MariaDB directly: rejected, because it couples Twenty to proopco's schema and bypasses proopco's own rules.
- Twenty polling a proopco "changes since" API: rejected, because purchases and lost accounts would arrive minutes late against hour-precision deadlines.
- Proopco sending webhooks without an outbox: rejected, because a failed delivery would be lost with no retry.
- Moving the support desk into Twenty: rejected, because Twenty has no ticketing equivalent and the desk is wired into the trader panel and the mobile API.
