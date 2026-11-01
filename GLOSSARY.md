# Proopco CRM

Twenty, used as the sales CRM for proopco, a prop trading firm. Proopco owns the trading and money facts, and Twenty owns the sales process built on them.

## People

**Trader**:
A proopco user who buys challenges, stored in Twenty as a Person. The business is B2C, so Companies are not used.
_Avoid_: customer, lead, user (in CRM context)

**Agent**:
A sales workspace member who works Followups and earns Commissions.
_Avoid_: admin, CRM user, salesperson

**Partner**:
A trader holding proopco's partner role, whose referrals are Traders linked to them by a "referred by" relation.
_Avoid_: affiliate, influencer

## Sales process

**Followup**:
An Agent's time-boxed attempt to get one Trader to buy, with a stage of Pending, Retry Pending, Succeeded, Failed or Expired. A Trader has at most one active Followup.
_Avoid_: opportunity, deal, tracking

**Followup Type**:
The kind of Followup. It sets the expiry and whether the Followup can earn Commission.

**Track**:
An Agent claiming a Trader, which creates a Pending Followup. It's the only way a Followup is created.
_Avoid_: assign, follow

**Retry Pending**:
The stage of a Succeeded Followup whose Trader's Trading Account failed. It stays with the same Agent for `RETRY_WINDOW_DAYS`.

**Pool**:
Retry Pending Followups whose owner was cleared after the retry window. Any Agent can claim one until `POOL_DAYS` pass and it expires.
_Avoid_: public followups, queue

**Activity**:
A Task attached to a Followup, typed as call, SMS, email, meeting or other.

## Trading facts (synced from proopco)

**Trading Account**:
A trader's account on a challenge, with its phase, status and failure reason, synced read-only from proopco.
_Avoid_: account (ambiguous with a Twenty workspace or login account)

**Payment**:
Cash actually received from a Trader, with the amount in USD and a kind of `purchase`, `installment_initial` or `installment_remaining`. Synced read-only from proopco.
_Avoid_: transaction, order

## Money

**Commission Tier**:
An editable row mapping days since the Followup was created (`minDay` to `maxDay`) to a commission `rate`.

**Commission**:
An Agent's earning from one Payment on a Followup that can earn Commission. It keeps a copy of the rate and settings it was calculated with.

**Monthly Income**:
An Agent's total Commissions for a calendar month, with a payout status of Pending or Paid. Commissions lock once it's Paid.
_Avoid_: salary, payout

## Outreach

**Segment**:
A saved filter over Traders, stored as a Twenty View.
_Avoid_: list, audience

**Campaign**:
A bulk SMS message sent to one Segment through the SMS app.

**Opt-out**:
A phone number that never receives Campaign SMS, whatever the Segment says.
_Avoid_: unsubscribe list, blacklist
