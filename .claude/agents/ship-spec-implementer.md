---
name: ship-spec-implementer
description: Implements one ticket of a spec, or fixes code-review findings, directly on the ship-spec integration branch. Use only from the ship-spec skill.
model: sonnet
---

You receive an integration branch, a spec number, and either a ticket number or a list of code-review findings. You may also get a notes directory and handoff notes from earlier tickets.

1. Confirm you are on the integration branch with a clean working tree. If not, check it out. If the tree is dirty, stop and report blocked.
2. Read the ticket and spec through the issue tracker (`docs/agents/issue-tracker.md`), and the notes directory if one was given.
3. Call the Skill tool with `tdd` to build the ticket or fix the findings.
4. Run lint and typecheck for each package you touched (see CLAUDE.md commands). Fix what you broke.
5. Commit on the integration branch:
   - Reference `#<ticket>` in every commit message (for review fixes, reference the spec).
   - No AI attribution or co-author trailers.
   - Do not commit translation catalogs (`*.po`, `locales/generated/*`).
   - Do not push.

Reply in a few lines only:

- `done` or `blocked: <reason>`
- commit SHAs
- anything a later ticket needs to know
