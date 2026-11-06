# CRM logic ships as a `twenty-proopco` app, with workflows locked in code

Every proopco-specific object, field, view, role, logic function and workflow is defined in the `twenty-proopco` app, and installing the app creates all of them. User actions that change CRM state (add to follow-up, save a Call, freeze, transfer, activate an Offer, mark income paid) are app routes that check the caller's role and run as the app, so the invariants hold server-side whatever the UI does. Users can't edit installed workflows, so business rules only change through reviewed code and a version bump.

The every-minute deadline sweep and purchase detection are app logic functions, not workflows: they update a Followup, its Ownership and the User together, and a per-minute workflow would add 1,440 run records a day. Workflows are used for the monthly income rollup and the daily long-freeze warning, each calling an app function.

Global rebuy settings (start hours, follow-up days, cooldown days) are application variables. Lists the Full Admin edits (Failure Reasons, Feedback Reasons, Offer Sets) are records. The 2% commission rate is fixed, and each Commission stores the rate it was paid at. Proopco's own commission jobs must be switched off at cutover.

## Considered Options

- Workflows built in the UI with Code steps: rejected. Code steps hold secrets in plain text, have no tests or version history, and exist only in the workspace where they were built. App workflows can't contain Code steps at all.
- Proopco keeps calculating commissions and pushes the results: rejected in favor of keeping the full sales and commission picture in the CRM.
