# Proopco Sales and Retention CRM

The language of Proopco's sales team: claiming platform users, following them up by phone, and keeping them as customers.

## People

**Agent**:
A Proopco staff member who claims and calls contacts. Supervisors doing call work are agents too.
_Avoid_: Sales Admin, salesperson, admin

**Full Admin**:
The single person who owns system settings, codes and reasons, and does no call work.

**Supervisor**:
Runs day-to-day operations and oversees agents; can also work as an agent.

**Contact**:
One platform user as the CRM sees them.
_Avoid_: Lead, platform user (in CRM context), customer (unless they bought)

**Contact owner**:
The single agent a contact belongs to right now. A contact has at most one.
_Avoid_: Assignee

**Scope**:
The contacts an agent can see: free contacts in their segments plus the contacts they own. Contacts outside it don't exist for them. Supervisors see every contact but can only work within their scope.

## Lifecycle

**Lifecycle stage**:
Where a contact stands right now: Free, Awaiting first call, In follow-up, Customer, Rebuy window, Cool-down or Do not contact.
_Avoid_: Status, state

**Customer**:
A contact who bought during follow-up and stays with their owner for retention.
_Avoid_: Successful user

**Do not contact**:
The permanent lifecycle stage of a contact closed with a predefined reason. They never return to any list.
_Avoid_: Failed user

**Cool-down**:
A period during which a contact whose deal expired is hidden from every list.

**Freeze**:
Pausing every deadline of one agent.

## Work

**Segment**:
A rule-defined set of contacts, such as "recently rejected". Membership is live: a contact is in a segment while they match its rule.

**Campaign**:
One or more segments plus the agents who work them, a cool-down, the codes they may offer, and the Tehran dates it runs between. Scheduled before its start date, Active while running, Ended after its end date or when ended early.

**User list**:
The Free contacts of the segments in an agent's active campaigns. A contact appears once even when several of those campaigns include them.
_Avoid_: Pool

**Deal**:
The permanent record of one follow-up period for one contact by one agent, from claim or rebuy start to its close.
_Avoid_: Case, follow-up case, opportunity (in conversation)

**Source campaign**:
The campaign a campaign deal was claimed through.

**Deal stage**:
Awaiting first call, In follow-up, Rebuy window, Won, Lost or Void.

**Won**:
A deal closed by a purchase attributed to its owner.
_Avoid_: Successful

**Lost**:
A deal closed without a purchase: expired, unanswered at first call, abandoned in 72 hours, or do not contact.

**Void**:
A deal closed without counting toward conversion: transferred, released, or purchased before the first call.

**Release**:
Handing an owned contact back to Free, with no cool-down, typically when their agent leaves.

**Rebuy deal**:
A deal opened automatically when a customer loses their last active account, starting in the Rebuy window.

**Next call**:
The one scheduled time an owner plans to call a contact next.

**Call**:
One logged phone attempt, answered or not, with its end-of-call form.

**Retention call**:
A call to a customer.

**Slot**:
One of five suggested call windows during follow-up.

**Missed slot**:
A slot whose window ended with no answered call, or that the agent skipped by their own decision. A slot skipped at the contact's request is moved, not missed.

**Overdue**:
A next call more than 2 hours late, or set for an earlier Tehran day. It stays in the queue until the agent calls.
_Avoid_: Late, red (outside the queue UI)

**Plan adherence**:
The share of an agent's slots done on time, out of slots done or missed. Moved slots don't count either way.

**Working day**:
A Tehran day an agent existed and was not frozen. Reports divide activity by working days.

## Money

**Purchase**:
A settled payment for a challenge account, in USDT after discount.

**Commission**:
2% of a purchase, credited to the contact owner at purchase time.

**Monthly income**:
One agent's commissions rolled up at the end of one Jalali month, with its payment status. A purchase that arrives after its own month was rolled up goes into the next one. No record exists for a month with nothing earned.

**Discount code**:
A platform reward with one capability (discount, reset or two-step payment) and a fixed expiry.

**Code activation**:
One discount code turned on for one contact. A code is activated for a contact at most once, ever.

**Code set**:
The codes an answered call may offer: the deal's campaign codes, the rebuy codes, or the retention codes on a retention call.

## Platform

**Platform**:
The Proopco system where users sign up, buy challenge accounts and receive discount codes and SMS. It is the source of truth for users, accounts and purchases.

**Platform event**:
A fact the platform reports about a contact: a profile change, a purchase, or a last account lost. It counts by when it happened, not when the CRM received it.
_Avoid_: Webhook, sync

**Last account lost**:
A customer's final active challenge account ended, leaving them with none. Losing one of several accounts is not this.
_Avoid_: Account lost, churn
