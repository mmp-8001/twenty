# Ownership is its own object, separate from Followup

"Who owns this User now" lives on an Ownership record, and each follow-up period is a Followup that is never deleted or moved. One Ownership can span several Followups (a campaign success, then a rebuy), and a transfer closes the old Followup and opens a new one under a new Ownership, so history stays with the Admin who earned it. Person keeps a copy of the current owner for views and row-level rules.

Apps can't declare partial unique indexes, so "at most one open Ownership per User" is an `openUserKey` field holding the User id while the Ownership is open and cleared when it closes, with a unique index on it. A concurrent second Add to follow-up fails on that index. Open Followups use the same pattern.

## Considered Options

- An `owner` field on Followup, as in #34: rejected, because successful Users have no open Followup but still have an owner, and the rebuy and transfer rules need ownership history.
