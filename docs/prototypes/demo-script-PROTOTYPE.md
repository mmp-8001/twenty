# PROTOTYPE: per-brand demo script (rough take, throwaway)

Draft for [Per-brand demo script](https://github.com/mmp-8001/twenty/issues/18). Not merged anywhere. React to it, then the agreed version goes into the ticket.

## Shared shape (every brand, about 12 minutes)

Each walkthrough has four acts. Act 3 is the only part done live; everything else is seeded.

1. **The manager's morning** (seeded, 2 min). Manager logs in (`?locale=fa`). Dashboard: lifecycle funnel (registered to active), segment split, leads by channel this month, commissions by employee this Jalali month. Pitch: "you see the whole customer base in one screen, in your own terms."
2. **The brand's retention moment** (seeded + one live edit, 3 min). A brand view of customers who need a call, open one customer, show the timeline (milestones, notes from earlier calls, the open task). Then one live record edit fires a workflow and a task appears for the account manager.
3. **A lead earns commission** (live, 5 min). Done by hand in the UI, each step a record trigger:
   1. Create a Lead (phone, channel). Round-robin assigns it to a sales employee.
   2. Switch to that sales employee (second browser profile). "My leads" shows only theirs (row-level). Mark contacted, add a Note.
   3. Create the Person with the same `+98` phone. Lead goes to registered, account manager is set to the assignee.
   4. Add the first-purchase Milestone with an amount at or above the minimum. Lead goes to converted, lifecycle to first purchase, a pending Commission appears.
   5. Sales employee sees their own pending commission and nothing else.
4. **Manager closes the loop** (live, 2 min). Manager opens Commissions for this month grouped by status, approves the new one; the dashboard bar for that employee moves. Ends on the funnel again.

Each brand varies act 2 and one rule in act 3, so the three demos don't feel identical and between them cover the rules.

## Gerami (digital gold)

Cast: manager Maryam Karimi; sales Sara Ahmadi, Ali Rezaei; about 400 customers, 90 days of history.

- Act 1: funnel plus RFM segment split; holdings value by segment ("champions hold X billion toman of gold").
- Act 2: view "at risk" (R > 60, holdings at least 50M). Open a customer holding 120 g of gold, inactive 75 days, with an open retention call task. Second beat: a delivery request stuck in preparing for 4 days, with its stall task (seeded, it's a cron result). Live edit: none needed; Sara completes the retention call task and logs a Note.
- Act 3 rule shown: **the minimum**. Instagram lead, first buy of 25M gold (above 20M) earns 2,000,000 toman. Optional aside: a seeded converted lead whose first buy was 8M, converted but no commission.
- Pitch: savers who go quiet still hold gold; the CRM tells you whom to call before they sell elsewhere.

## Kifpool (crypto exchange)

Cast: manager Reza Moradi; sales Neda Hosseini, Hamid Jafari; about 600 customers incl. a few corporate accounts.

- Act 1: funnel plus segment split by money direction (new, withdrawing, active trader, regular, holder, dormant).
- Act 2: view "withdrawing". Open a customer with a seeded `large_withdrawal` of 700M and its same-day call task. Live edit: set a pending customer's `kycStatus` to rejected, reason "Shahkar mismatch"; a 24 h call task appears for their account manager.
- Act 3 rule shown: **partnership at 50%**. Telegram bot lead with an influencer code, so the lead carries the partnership; first trade of 15M (above 10M) earns 750,000 instead of 1,500,000.
- Pitch: you catch money leaving and failed KYC the same day, and you see which influencers actually bring traders.

## Proopco (prop firm)

Cast: manager Leila Najafi; sales Omid Sadeghi, Fatemeh Ebrahimi; about 300 traders, challenge accounts across phases.

- Act 1: funnel plus program-state segments (earning, funded, in challenge, retry candidate, new, lapsed); funded capital in USD.
- Act 2: Challenge accounts kanban by phase. Live edit: move one phase 2 account to status breached, reason max drawdown; a 24 h retry-offer call task appears. Show "retry candidates" view (seeded) as the bigger picture.
- Act 3 rule shown: **reassignment**. Lead lands with Omid; manager reassigns to Fatemeh before conversion; the challenge purchase earns Fatemeh the full 3,000,000. Window is not reset.
- Pitch: every breach is a second sale if someone calls within a day.

## What the seed must contain for this to work

- Per brand: one manager, two sales, one support member; sales logins in a second browser profile.
- Precomputed cron results: segments, lifecycle stages incl. inactive, stall/retention/onboarding tasks, a few expired leads.
- A month of commissions in mixed statuses so the dashboard isn't empty, incl. one void with a reason.
- A blank "demo" phone number per brand reserved for the live lead so reruns don't collide (or a reset between runs).

## Open questions for review

1. Is act 3 per brand worth repeating, or do it fully once (Gerami) and in the other two just show the seeded result plus their one rule?
2. Support: the destination mentions support flows. Is a seeded Note/Task trail on the customer enough, or does each brand need a support beat (and a Support member logged in)?
3. Creating the Person by hand stands in for "the app registered them". Acceptable to say that out loud in the demo?
4. Live workflows run through the worker, a few seconds late. Fine to wait on screen, or refresh?
