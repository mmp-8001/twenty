# Are front components ready for the claim button and end-of-call form?

Ticket: #64 (part of #61). Checked against this fork at `204821bbbc` (SDK and `twenty-ui` 2.58.0), 2026-11-10.

## Verdict

**Yes, usable.** Every piece Proopco needs already ships, and the repo has an example app built almost the same way (`document-generator`). There are three limits to plan around:

1. `twenty-ui` has **no time picker**. Its `DatePicker` picks dates only. For date and time capped at a deadline, use a native `<input type="datetime-local" max=...>`, which the sandbox supports, or pair `DatePicker` (`isDateUnavailable`) with a time `Select`.
2. A view row has **no per-row button slot**. "Add to follow-up" on a row is a `RECORD_SELECTION` command: it shows in the row's right-click menu, in Cmd+K and in the selection action bar. It is not an inline cell button.
3. The UI cannot enforce anything. The deadline cap, "submit once" and the claim rules must be checked again in the logic function, with an idempotency key.

## (a) "Add to follow-up" on a Person record and on view rows

- Declare a `defineCommandMenuItem` with `availabilityType: 'RECORD_SELECTION'` and `availabilityObjectUniversalIdentifier` set to Person. Point it at a **headless** front component that renders `<Command execute={...} />`. ([command-menu-items.mdx](../../packages/twenty-docs/developers/extend/apps/layout/command-menu-items.mdx), "Configuration fields" and "Headless commands")
- **Where it shows up:**
  - On the record page, the host makes the open record the selection (`RecordShowContainerContextStoreTargetedRecordsEffect.tsx` sets `selectedRecordIds: [recordId]`), so the command appears there. With `isPinned: true` it is also a button at the top right.
  - In index views, the row right-click dropdown lists only `RECORD_SELECTION` items (`packages/twenty-front/src/modules/command-menu-item/components/RecordIndexCommandMenuDropdown.tsx`).
- **Bulk selections:** `useSelectedRecordIds()` holds the ids. Under "Select all" it is empty, so use `useSelectedRecordsFilter()` instead (front-components.mdx, "Select all"). Narrow with `numberOfSelectedRecords` in `conditionalAvailabilityExpression` if claiming must be single-record.
- **Showing the server's error:**
  - `Command` already turns a thrown error into a snackbar and then unmounts (front-components.mdx, "SDK Command components").
  - `RestApiClient` throws `RestApiClientError` with `status` and the parsed `body` (front-components.mdx, "Calling the Twenty REST API").
  - If a logic-function handler **throws**, the route answers `500` with `{ statusCode, error, messages: [message] }` (`route-trigger.service.ts` maps it to `ROUTE_TRIGGER_USER_UNCAUGHT_ERROR`; body built in `http-exception-handler.service.ts`).
  - Cleaner option: have the handler **return** `new Response(JSON.stringify({ message }), { status: 409, headers: { 'content-type': 'application/json' } })`, then rethrow `error.body.message` so the snackbar shows it (logic-functions.mdx, "Custom HTTP response").

## (b) Side-panel end-of-call form

- **Opening it:** a command whose component is **not headless** opens in the side panel, with the selected record ids and object passed in.
  - Host: `useCommandMenuItemClick.ts` calls `openFrontComponentInSidePanel({ recordContext: { objectNameSingular, selectedRecordIds, selectedRecordsFilter } })`.
  - Component: reads them with `useSelectedRecordIds()` and `useSelectedObjectMetadata()`.
  - From another component, `openSidePanelPage` or `CommandOpenSidePanelPage` opens it too.
- **Reference implementation:** `packages/twenty-apps/examples/document-generator`. A Person `RECORD_SELECTION` command opens a side-panel form, which posts to `/s/...` with `RestApiClient`, shows a snackbar on success or failure, and calls `closeSidePanel()`.
- **Controls available in `twenty-ui/primitives/input`** (exports listed in `packages/twenty-ui/src/primitives/input/index.ts`): `Field` (with `Field.Error`), `Input`, `Textarea`, `Select` (supports `multiple`), `Autocomplete`, `Checkbox`, `RadioGroup`, `Switch`, `NumberField`, `Button`. `MainButton` lives in `twenty-ui/components/input`.
  - Pass `alignItemWithTrigger={false}` to `Select.Positioner`, or the popup collapses (front-components.mdx, "Importing components").
- **Conditional fields:** plain React state. Nothing special is needed.
- **Date and time:**
  - `twenty-ui/components/input` `DatePicker` takes `value: string | null`, a date with no time, plus `isDateUnavailable(date)` to block days past the deadline (`DatePicker/types/DatePickerProps.ts`). There is no time picker in `twenty-ui`.
  - The sandbox forwards `type`, `min`, `max` and `step` on `<input>` (`packages/twenty-front-component-renderer/src/constants/AllowedHtmlElements.ts`), so `<input type="datetime-local" max={deadline}>` works, with the browser's own picker.
- **Submitting once:** disable the button while the request is in flight, then `closeSidePanel()`. Send an idempotency key (for example the call id) and have the logic function reject repeats. The sandbox cannot guarantee a single submit.
- **Modals:**
  - Never render `Dialog` or `AlertDialog`; use `openCommandConfirmationModal` (front-components.mdx, "Host communication API").
  - Body portals (dropdown popups) are clipped to 200px around the component, so give long option lists their own scroll ("DOM access").

## (c) Calling logic functions as the viewer

- The front component calls `new RestApiClient().post('/s/<path>', body)`. The token Twenty mints for the component **always acts as the person looking at the page**, and `runAs: 'application'` throws in a component (front-components.mdx, "Calling a logic function" and "Calling the Twenty REST API").
- Use `isAuthRequired: true` on `httpRouteTriggerSettings`. The handler's second argument (`LogicFunctionExecutionContext`) then carries `userWorkspaceId` and `workspaceMemberId` of the caller. The server sets them from the route auth context in `route-trigger.service.ts` (lines ~285-330). Docs: logic-functions.mdx, "Execution context".
- Default clients inside the function act as that person, intersected with the app's role. Use a second `CoreApiClient({ runAs: 'application' })` for writes the agent may not do directly, for example claim bookkeeping (logic-functions.mdx, "Whose access a call uses").
- Never trust a member id sent in the body. Read it from the context.

## Limits and known issues

- **Partial DOM, silent failures.** Missing APIs mostly fail with no error. Known gaps: `IntersectionObserver`, canvas, `getClientRects`, unscoped CSS (prefix class names), `@media` evaluated against the browser window, and only allow-listed attributes forwarded (front-components.mdx, "Current limitations").
- **Error codes.** Platform answers on routes: `402`, `403` (app stopped), `404`, `409` (storage limit), `422` and `429` (logic-functions.mdx, "Platform error responses"). Map them to readable messages.
- **Upstream issue twentyhq/twenty#25838** (open): `preventDefault` does not cross the sandbox. Form submit and link clicks are guarded by the host, so it does not block a form.
- **Upstream issue twentyhq/twenty#23826** (file input): still open, but the current docs say file selection works ("File selection"). It is not needed here.
- **Third-party calls.** Direct `fetch` to other origins goes out with `Origin: null`. Keep such calls in logic functions.
