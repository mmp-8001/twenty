# Machine-translation pipeline for the `fa` catalogs

Fills empty `msgstr` entries in the Persian catalogs. Kept so topping up after
an upstream rebase is a rerun rather than a rediscovery.

Agents never touch `.po` files: they read a JSON batch and write a JSON batch,
and all reassembly is deterministic and keyed by message id.

```
lingui extract            ->  fa.po gains empty msgstr for new source strings
prepare.js                ->  .i18n-run/in/<chunk>.json, map-<pkg>.json, plan.json
Workflow (fan-out)        ->  .i18n-run/out/<chunk>.json
reassemble.js --write     ->  validates, then fills msgstr in the .po files
lingui compile            ->  locales/generated/fa.ts, which the app loads
```

## Running it

```bash
npx nx run twenty-front:lingui:extract      # and twenty-server, twenty-emails
git checkout -- <every non-fa .po>          # extract rewrites all 33 locales
node tools/i18n-translate/prepare.js
# run the Workflow fan-out over plan.json's chunkIds
node tools/i18n-translate/reassemble.js     # dry run, prints the gates
node tools/i18n-translate/reassemble.js --write
npx nx run twenty-front:lingui:compile      # and twenty-server, twenty-emails
```

`lingui extract` rewrites every locale's catalog, not just `fa`. Only the `fa`
files belong in a commit here: the rest is churn against upstream's Crowdin
output and will conflict on every rebase.

## Validation gates

`reassemble.js` refuses to write a translation that fails any of:

- **placeholders** — same `{var}` set, same ICU `plural`/`select` openers, same
  `#` count, balanced braces
- **whitespace** — leading and trailing whitespace forced byte-exact with source
- **pass-through** — empty, punctuation-only and digit-only sources are kept
  verbatim rather than sent through a model

A failing or missing entry is **left empty**, never backfilled with English.
Lingui already falls back to the source string at runtime, and an empty
`msgstr` is what lets the next run pick the entry up again.

## Run safety

Batch ids are positional, so output from one run must never be applied to
another's map. `prepare.js` clears `.i18n-run/` and stamps a `runId` into both
`plan.json` and each map; `reassemble.js` refuses to run if they disagree.

## Glossary

`glossary.json` freezes 208 recurring domain nouns (`record` -> `رکورد`). It is
injected into every batch prompt. Without it, separate runs pick different
Persian words for the same concept and the UI reads inconsistently. Extend it
rather than letting a run invent a new rendering.
