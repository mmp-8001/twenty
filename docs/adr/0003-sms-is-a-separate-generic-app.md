# SMS sending is a separate, business-agnostic `twenty-sms` app

SMS sending lives in its own app, so other businesses can reuse it. The app owns a queued SMS Message object, SMS opt-out by phone number (checked at enqueue time for every sender), a throttled cron sender, and the provider delivery callback. Provider credentials are secret server variables. An app's workflows can only call that app's own logic functions, so `twenty-proopco` reaches it through the HTTP route `/s/sms/enqueue`, guarded by a shared token. Drop the token if Twenty turns out to authenticate calls between apps on these routes.

## Considered Options

- SMS sending inside `twenty-proopco`: rejected, because it isn't reusable and mixes provider concerns into the CRM.
- Sending from workflow loops with HTTP steps: rejected, because it has no throttling, no retries and no delivery tracking at bulk volume.
