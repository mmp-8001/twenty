# Followup is a custom object, not the standard Opportunity

A Followup is shaped like a deal: it has an owner, a type, an expiry and an outcome. Even so, it's defined as a custom object, and Opportunity is hidden. An app can only add fields to standard objects. It can't replace Opportunity's fixed `stage` options. Using Opportunity would mean a second stage field next to the hidden standard one, plus exposure to upstream changes to Opportunity. The Followup object has its own `stage` (Pending, Retry Pending, Succeeded, Failed, Expired) and a Kanban view grouped by it.
