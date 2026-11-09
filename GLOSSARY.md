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
A rule-defined set of contacts, such as "recently rejected".

**Campaign**:
A segment plus the agents who work it, a cool-down and the codes they may offer.

**User list**:
The unowned, not cooling-down contacts of the segments in an agent's campaigns.
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
A deal closed without counting toward conversion: transferred, or purchased before the first call.

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

## Money

**Purchase**:
A settled payment for a challenge account, in USDT after discount.

**Commission**:
2% of a purchase, credited to the contact owner at purchase time.

**Monthly income**:
One agent's commissions for one Jalali month, with its payment status.

**Discount code**:
A platform reward with one capability (discount, reset or two-step payment) and a fixed expiry.

**Code activation**:
One discount code turned on for one contact.
