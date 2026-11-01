# CRM logic ships as a `twenty-proopco` app, with workflows locked in code

Every proopco-specific object, field, view, role, logic function and workflow is defined in the `twenty-proopco` app, and installing the app creates all of them. Users can't edit installed workflows, so the commission flow can only change through reviewed code and a version bump. Values the business adjusts are editable without a deploy. Tables of values are records: Commission Tier (`minDay`, `maxDay`, `rate`) and Followup Type (`expiryDays`, `commissionable`). Single settings are application variables: `RETRY_WINDOW_DAYS`, `POOL_DAYS`, `COMMISSION_BASIS`, `INSTALLMENT_REMAINING_EARNS` and `COMMISSION_SCOPE`. Each Commission keeps a copy of the rate and settings it was calculated with.

Commission calculation lives in Twenty, not proopco, so proopco's commission jobs (`ProcessAccountPurchaseCommission`, `RecalculateFollowupCommissions`, `CalculateMonthlyIncomes`) must be switched off at cutover.

## Considered Options

- Workflows built in the UI with Code steps: rejected. Code steps can only hold secrets in plain text in the function body, have no tests or version history, and exist only in the workspace where they were built.
- Proopco keeps calculating commissions and pushes the results: rejected in favor of keeping the full sales and commission picture in the CRM.
