# Sidebar

The app ships workspace navigation menu items. Each item lists the roles that see it (`visibleToRoleUniversalIdentifiers`, a field this fork adds to Twenty). No list means every role. The server filters `navigationMenuItems` by the caller's role. A role change shows on the next page load.

This controls the sidebar only, not access: object and row permissions still decide what a user can open.

Items are flat, no folders, placed before Twenty's own items (negative positions), in this order: Home, management, configuration, then the "my" lists.

| Role | Sidebar |
|---|---|
| Agent | Home, My follow-ups, Contact list, My rebuy list, My customers, My history, Calls |
| Supervisor | Home, Campaigns, Segments, Agents, Frozen agents, Monthly incomes, Awaiting payment, then the Agent items |
| Full Admin | Home, the Supervisor's management items, Discount codes, Reasons, Settings |
| Admin (Twenty's built-in) | Home, the Full Admin items, Failed platform events, Calls |
| Member, Deactivated, any other role | Home |

API keys and app tokens have no role and see every item.

0.1.19 built personal sidebar items under Favorites. After installing 0.1.22, delete the old «کار من» and «مدیریت» folders under Favorites by hand.
