# Calls are a custom object, not Tasks

A Call is a permanent record of something that happened: its technical status and reasons are locked once saved, it can't be deleted by any role, and only its author edits the note. Field locks and delete bans apply per object, so making Tasks immutable would lock every task in the workspace. Tasks also link to Users through a junction that row-level rules can't traverse, which would hide earlier owners' calls from the new owner after a transfer. Each Call is also written as a timeline activity on the Person, so calls still read like native history.
