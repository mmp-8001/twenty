---
name: ship-spec
description: "Implement the result of /to-spec and /to-tickets in code, one ticket at a time, using dedicated sonnet/haiku subagents."
disable-model-invocation: true
---

You have been provided a spec. It should have tickets describing how to implement it.

The issue tracker should have been provided to you (`docs/agents/issue-tracker.md`). If not, tell the user to run `/setup-matt-pocock-skills`.

The goal is the entire spec implemented on a single **integration branch**, with every ticket closed the way the issue tracker closes work.

The tickets are a **task graph** with blocking relationships. The **frontier** is the set of open tickets whose blockers are all done.

Subagents:

- `ship-spec-explorer` (haiku): optional, read-only exploration that saves notes.
- `ship-spec-implementer` (sonnet): builds one ticket, or fixes code-review findings.

Each starts with a fresh context. Their role instructions live in their agent definitions, so keep your messages to them short: pass **context pointers** (spec number, ticket number, notes directory, integration branch), not copies of the content.

Implementers run **one at a time, in the foreground**, committing directly on the integration branch. Never start an implementer while another is running.

## Steps

1. Read the spec and all its tickets. Build the task graph.

2. (optional) If the tickets need codebase or external-doc exploration, run one `ship-spec-explorer` with the spec number and the notes directory `/tmp/ship-spec/<spec-number>/`.

3. Integration branch: `ship-spec/<spec-number>-<slug>`, created from the current branch. If it already exists, check it out and treat tickets that already have commits referencing `#<ticket>` on it as done.

4. Loop until no tickets remain:
   - Pick the first frontier ticket in tracker order.
   - Run `ship-spec-implementer` with: ticket number, spec number, integration branch, notes directory (if any).
   - If it reports **done**, record the ticket as done along with its commit SHAs, and pass any handoff notes to later implementers that need them.
   - If it reports **blocked**, or tests are red, stop. Report the ticket and the reason to the user. Do not start another ticket.

   Do not close tickets during the loop.

5. Call the Skill tool with `code-review`, using the integration branch's starting point as the fixed point. Fix all findings with a single `ship-spec-implementer`, passing it the review findings instead of a ticket.

6. Close each ticket the way the issue tracker closes work, with a comment linking its commit(s). Do not push or open a PR unless the user asked for it.

7. Report the integration branch, the tickets closed, and anything left unresolved.
