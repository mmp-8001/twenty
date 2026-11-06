# Proopco CRM

Twenty, used as the sales and retention CRM for proopco, a prop trading firm. Proopco owns the platform facts (users, challenge accounts, payments, discount codes), and Twenty owns the follow-up process built on them. The approved product spec is #42 (CRM3); rule IDs such as `OWN-03` refer to it.

## People and roles

**User**:
A proopco platform user, stored in Twenty as a Person. The business is B2C, so Companies are not used.
_Avoid_: trader, customer, lead (and don't confuse with a Twenty login, which is a workspace member)

**Admin**:
A workspace member working in the CRM, with one of three roles. An Admin is active, frozen or deactivated.
_Avoid_: agent, salesperson, CRM user

**Sales Admin**:
The Admin role that calls Users and works Followups, only within their own scope.

**Supervisor**:
The Admin role that runs daily operations: segments, campaigns, freezes, transfers. Can also work Followups when a campaign is assigned to them.

**Full Admin**:
The single top Admin role. Owns Offers, global settings, reason lists, deactivation and income payout. Does no operational work.

## Audiences

**Segment**:
A rule-based set of Users, stored as a saved Twenty View over Person. Membership is computed from live data, never stored as a list.
_Avoid_: list, audience

**Campaign**:
A Segment assigned to one or more Admins, with its own cooldown and allowed Offers. Its unowned Users appear in every assigned Admin's User list.
_Avoid_: SMS campaign, blast

**User list**:
The unowned Users of the Campaigns assigned to an Admin. It is the shared pool; there is no separate pool concept.
_Avoid_: pool, queue

**Scope**:
The Users an Admin may see: their Campaigns' Users plus the Users they own. A Sales Admin never learns that anyone outside their Scope exists.

## Follow-up process

**Ownership**:
Which Admin a User belongs to right now. A User has at most one open Ownership. It is temporary and kept separate from history.
_Avoid_: assignment, claim

**Add to follow-up**:
An Admin taking an unowned User from the User list or the Rebuy list. The first click wins.
_Avoid_: track, assign, claim

**Followup**:
A case: one permanent record of a follow-up period by one Admin, with its kind (campaign or rebuy), status, deadlines and calls. Never deleted or moved to another Admin. One Ownership can have several Followups.
_Avoid_: opportunity, deal, ticket

**Waiting for first call**:
A Followup's first phase, from Add to follow-up until the first answered Call, at most 7 days.

**In follow-up**:
The 30 days counted from the first answered Call (or, for a rebuy Followup, from Add to follow-up).

**Successful**:
A Followup that ended in a purchase. The User stays with the same Admin for retention.

**Expired**:
A Followup whose 30 days ended without a purchase. The User goes into cooldown.

**Failed**:
A User closed manually with a predefined Failure Reason. Permanent: the User never appears in any list again.
_Avoid_: lost, rejected

**Purchase before call**:
A purchase while waiting for the first call. Not a success, earns nothing, and frees the User.

**Cooldown**:
The period an expired User is hidden from every list before returning automatically.

**Rebuy list**:
A separate page of an Admin's successful Users who lost their last active Challenge Account, each with 72 hours for Add to follow-up before being released.

**Retention call**:
A Call with a successful User.

**Freeze**:
Stopping every deadline of one Admin (leave, illness). Users stay theirs and hidden from others.

**Transfer**:
A Supervisor or Full Admin moving Users to another Admin. The old Followup closes as transferred and a new one opens with the remaining time.

## Calls

**Call**:
One logged call with a User: technical status, note, reasons, next call time. Never deleted; only the note can be edited, by its author.
_Avoid_: activity, task

**Answered call**:
A Call whose technical status is answered. Says nothing about the sale.
_Avoid_: successful call

**Touch**:
One of the 5 suggested call windows of a Followup (day 0, 1–3, 4–7, 8–15, 16–30). Done, missed, or moved at the User's request.
_Avoid_: step, attempt

**Failure Reason**:
A predefined reason for Failed.

**Feedback Reason**:
A predefined satisfaction or dissatisfaction reason picked on an answered Call. Never removes the User from follow-up.

## Platform facts (synced from proopco)

**Challenge Account**:
A User's account on a prop challenge, with its phase and status, synced read-only. Losing the last active one sends a successful User to the Rebuy list.
_Avoid_: trading account, account (ambiguous with a Twenty login)

**Payment**:
A settled payment for a Challenge Account, with toman and USDT amounts converted by proopco. A Payment is what "purchase" means.
_Avoid_: transaction, order

## Offers and money

**Offer**:
A discount code defined by the Full Admin, with a capability (discount, reset, installment) and a fixed expiry. The real code lives in proopco.
_Avoid_: gift, coupon, reward

**Offer Activation**:
An Offer turned on for one User at the end of an answered Call, followed by an SMS. At most once per Offer and User.

**Offer Set**:
The global rebuy codes or retention codes offered on those Calls.

**Commission**:
2% of one Payment attributed to the Admin who owned the User at purchase time. One per Challenge Account.

**Monthly Income**:
An Admin's Commissions for one Jalali month, pending until the Full Admin marks it paid.
_Avoid_: salary, payout

**Audit Log**:
Append-only record of transfers, freezes, releases, deactivations, note edits, Offer deactivations, settings changes and income payouts.
