// Collect untranslated entries from the fa catalogs, chunk them for translator
// agents, and write the id -> msgid maps that reassemble.js reads back.
//
// Run from the repo root: node tools/i18n-translate/prepare.js
//
// Outputs under OUT:
//   in/<pkg>-<NNN>.json  chunk input: { package, chunkId, runId, entries:[{id, source}] }
//   map-<pkg>.json       { runId, byId: { id: msgid } }
//   plan.json            chunk list + counts
const PO = require('pofile');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT = process.env.I18N_OUT ?? path.join(ROOT, '.i18n-run');
const LOCALE = process.env.I18N_LOCALE ?? 'fa';

const PACKAGES = [
  { key: 'front', prefix: 'f', po: `packages/twenty-front/src/locales/${LOCALE}.po` },
  { key: 'server', prefix: 's', po: `packages/twenty-server/src/engine/core-modules/i18n/locales/${LOCALE}.po` },
  { key: 'emails', prefix: 'e', po: `packages/twenty-emails/src/locales/${LOCALE}.po` },
];

const CHUNK_SIZE = 80;

// Ids are positional, so output from an earlier run would be applied to the
// wrong strings. Clear the directories and stamp this run so reassemble.js can
// reject anything stale.
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'in'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'out'), { recursive: true });
const runId = `${Date.now()}`;

const plan = { runId, chunkSize: CHUNK_SIZE, packages: [] };

for (const pkg of PACKAGES) {
  const po = PO.parse(fs.readFileSync(path.join(ROOT, pkg.po), 'utf8'));
  const untranslated = po.items.filter(
    (item) => !item.obsolete && (!item.msgstr || !item.msgstr[0]),
  );

  // Group by source reference so each chunk is topically coherent.
  untranslated.sort((a, b) => {
    const refA = (a.references && a.references[0]) || '';
    const refB = (b.references && b.references[0]) || '';
    return refA.localeCompare(refB) || a.msgid.localeCompare(b.msgid);
  });

  const byId = {};
  const entries = untranslated.map((item, index) => {
    const id = pkg.prefix + String(index).padStart(5, '0');
    byId[id] = item.msgid;
    return { id, source: item.msgid };
  });

  fs.writeFileSync(
    path.join(OUT, `map-${pkg.key}.json`),
    JSON.stringify({ runId, byId }),
  );

  const chunks = [];
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunkId = `${pkg.key}-${String(chunks.length).padStart(3, '0')}`;
    fs.writeFileSync(
      path.join(OUT, 'in', `${chunkId}.json`),
      JSON.stringify({
        package: pkg.key,
        chunkId,
        runId,
        entries: entries.slice(i, i + CHUNK_SIZE),
      }),
    );
    chunks.push({ chunkId, count: Math.min(CHUNK_SIZE, entries.length - i) });
  }

  plan.packages.push({ key: pkg.key, total: entries.length, chunks });
  // oxlint-disable-next-line no-console
  console.log(`${pkg.key}: ${entries.length} entries -> ${chunks.length} chunks`);
}

plan.chunkIds = plan.packages.flatMap((p) => p.chunks.map((c) => c.chunkId));
plan.totalEntries = plan.packages.reduce((n, p) => n + p.total, 0);
fs.writeFileSync(path.join(OUT, 'plan.json'), JSON.stringify(plan, null, 2));
// oxlint-disable-next-line no-console
console.log(
  `TOTAL: ${plan.totalEntries} entries, ${plan.chunkIds.length} chunks, runId ${runId}`,
);
