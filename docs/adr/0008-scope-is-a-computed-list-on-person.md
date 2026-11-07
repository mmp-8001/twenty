# A Sales Admin's Scope is a computed list on Person

A Sales Admin may only see Users in their Campaigns' Segments plus the Users they own (`OWN-08`). Row-level permission predicates can only compare a record's own fields with the current workspace member; they can't follow a relation, so "a Campaign Admin record links me to this User's Segment" can't be expressed. Each Person therefore carries a `visibleToMemberIds` list that the app recomputes, and the Sales Admin role reads Person where that list contains the current member or the current owner is the current member. This holds for record views, search, GraphQL, REST and aggregates alike.

The list is recomputed for a User after a sync or ownership change, for a Campaign's audience after a Campaign, Segment or assignment change, and for everyone hourly so relative-date Segments stay current. A User can therefore appear in a list up to an hour late, never early. Row-level permissions require the Organization plan, which the self-hosted instance has.

## Considered Options

- Hiding Users only in app screens: rejected, because the API, search and Twenty's own views would still expose them.
- A relation-hop predicate: not available; the server treats such predicates as matching nothing, and the SDK can't declare them.

Note: the "Sales Admin" role was later relabelled "Sales Agent"; identifiers keep `SALES_ADMIN`.
