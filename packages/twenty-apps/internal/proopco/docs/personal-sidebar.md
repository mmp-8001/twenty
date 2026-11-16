# Personal sidebar

Twenty has one workspace sidebar and no per-role navigation. The app builds each user's sidebar as personal navigation menu items (the "Favorites" section) from their role, matching the wireframe boards 1-14.

## How it works

- The app ships one workspace nav item: Home («خانه»), the role-aware Report page layout. Every other app nav item is personal.
- `POST /s/sidebar/sync` (auth required) builds the caller's personal items. Body `{ force?: boolean }`, response `{ changed: boolean }`.
  - It uses the caller's own `new MetadataApiClient()` (user-delegated token). The server forces `userWorkspaceId` to the caller, so a user can only build their own sidebar.
  - It reads the caller's role with `resolveCallerRoleIdentifiers` and whether their workspace member has an Agent (`agentId`).
  - App-made personal items are the caller's personal items whose `viewId` or `pageLayoutId` belongs to one of the app's views or page layouts, plus the app's folders (matched by name in either locale). Everything else in Favorites belongs to the user and is never touched.
  - Without `force`, if the app-made items already match the role's spec (same targets, same folders, same order), nothing is written and `changed` is `false`. Otherwise app-made items are deleted and recreated.
- The Home page front component calls sync with no body on load, so new users and role changes fix themselves. Cmd+K "Reset my sidebar" calls it with `force: true`.

## Spec by role

Folder names follow the caller's locale (`fa-IR` vs anything else).

| Role | Items |
|---|---|
| Agent | Folder «کار من» / "My work": My follow-ups (page layout), Contact list, My rebuy list, My customers, My history, Calls |
| Supervisor | Folder «مدیریت» / "Management": Campaigns, Segments, Agents, Frozen agents, Monthly incomes, Awaiting payment. If their member has an Agent, also the Agent's «کار من» folder after it |
| Full Admin | «مدیریت»: the Supervisor items, then Discount codes, Reasons, Settings |
| Technical admin (none of the four Proopco roles) | Full Admin's «مدیریت», then Failed platform events, Calls |
| Deactivated | Nothing |

Home (the Report page) is not repeated in personal items.
