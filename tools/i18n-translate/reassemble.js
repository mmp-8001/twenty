// Validate translator output and write it back into the fa catalogs.
//
//   node tools/i18n-translate/reassemble.js            dry run + report
//   node tools/i18n-translate/reassemble.js --write    also write the .po files
//
// Entries that are missing or fail integrity are LEFT EMPTY rather than filled
// with the English source: Lingui already falls back to the source at runtime,
// and an empty msgstr is what makes a re-run pick the entry up again.
const PO = require('pofile');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT = process.env.I18N_OUT ?? path.join(ROOT, '.i18n-run');
const LOCALE = process.env.I18N_LOCALE ?? 'fa';
const WRITE = process.argv.includes('--write');

const PACKAGES = [
  { key: 'front', po: `packages/twenty-front/src/locales/${LOCALE}.po` },
  { key: 'server', po: `packages/twenty-server/src/engine/core-modules/i18n/locales/${LOCALE}.po` },
  { key: 'emails', po: `packages/twenty-emails/src/locales/${LOCALE}.po` },
];

const simpleVars = (s) =>
  (s.match(/\{\s*[a-zA-Z0-9_]+\s*\}/g) || []).map((x) => x.replace(/\s/g, '')).sort();
const icuVars = (s) =>
  (s.match(/\{\s*[a-zA-Z0-9_]+\s*,\s*(?:plural|select|selectordinal)/g) || [])
    .map((x) => x.replace(/\s/g, ''))
    .sort();
const countOf = (s, ch) => (s.match(new RegExp('\\' + ch, 'g')) || []).length;
// Sources with nothing to translate: empty, or only punctuation/symbols/digits.
const isPassThrough = (s) => /^[\s\p{P}\p{S}\d]*$/u.test(s);
const leading = (s) => (s.match(/^\s*/) || [''])[0];
const trailing = (s) => (s.match(/\s*$/) || [''])[0];

const plan = JSON.parse(fs.readFileSync(path.join(OUT, 'plan.json'), 'utf8'));
const report = { runId: plan.runId, byPackage: {}, failures: [] };

for (const pkg of PACKAGES) {
  const map = JSON.parse(fs.readFileSync(path.join(OUT, `map-${pkg.key}.json`), 'utf8'));
  if (map.runId !== plan.runId) {
    throw new Error(`map-${pkg.key}.json is from run ${map.runId}, expected ${plan.runId}`);
  }

  const translated = {};
  const outDir = path.join(OUT, 'out');
  const chunkFiles = fs.existsSync(outDir)
    ? fs.readdirSync(outDir).filter((f) => f.startsWith(pkg.key + '-') && f.endsWith('.json'))
    : [];

  for (const file of chunkFiles) {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(outDir, file), 'utf8'));
    } catch {
      report.failures.push({ pkg: pkg.key, chunk: file, reason: 'unparseable-output' });
      continue;
    }
    const entries = Array.isArray(parsed) ? parsed : parsed.entries;
    if (!Array.isArray(entries)) {
      report.failures.push({ pkg: pkg.key, chunk: file, reason: 'unexpected-shape' });
      continue;
    }
    for (const entry of entries) {
      if (entry && typeof entry.id === 'string' && typeof entry.translation === 'string') {
        translated[entry.id] = entry.translation;
      }
    }
  }

  const finalById = {};
  const stats = { total: 0, ok: 0, passthrough: 0, missing: 0, integrity: 0 };

  for (const [id, source] of Object.entries(map.byId)) {
    stats.total++;

    if (isPassThrough(source)) {
      finalById[id] = source;
      stats.passthrough++;
      continue;
    }

    let candidate = translated[id];
    if (typeof candidate !== 'string' || candidate.trim() === '') {
      stats.missing++;
      report.failures.push({ pkg: pkg.key, id, reason: 'missing', source });
      continue;
    }

    // Byte-exact leading/trailing whitespace, which Lingui joins on.
    candidate =
      leading(source) + candidate.replace(/^\s+/, '').replace(/\s+$/, '') + trailing(source);

    const placeholdersMatch =
      simpleVars(source).join('|') === simpleVars(candidate).join('|') &&
      icuVars(source).join('|') === icuVars(candidate).join('|') &&
      countOf(source, '#') === countOf(candidate, '#') &&
      countOf(source, '{') === countOf(candidate, '{') &&
      countOf(source, '}') === countOf(candidate, '}');

    if (!placeholdersMatch) {
      stats.integrity++;
      report.failures.push({ pkg: pkg.key, id, reason: 'integrity', source, translation: candidate });
      continue;
    }

    finalById[id] = candidate;
    stats.ok++;
  }

  report.byPackage[pkg.key] = stats;
  // oxlint-disable-next-line no-console
  console.log(`${pkg.key}: ${JSON.stringify(stats)}`);

  if (WRITE) {
    const poPath = path.join(ROOT, pkg.po);
    const po = PO.parse(fs.readFileSync(poPath, 'utf8'));
    const byMsgid = {};
    for (const [id, value] of Object.entries(finalById)) byMsgid[map.byId[id]] = value;

    let filled = 0;
    for (const item of po.items) {
      if (item.obsolete) continue;
      if ((!item.msgstr || !item.msgstr[0]) && Object.hasOwn(byMsgid, item.msgid)) {
        item.msgstr = [byMsgid[item.msgid]];
        filled++;
      }
    }
    fs.writeFileSync(poPath, po.toString());
    // oxlint-disable-next-line no-console
    console.log(`  -> wrote ${filled} msgstr into ${pkg.po}`);
  }
}

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
const byReason = {};
for (const failure of report.failures) byReason[failure.reason] = (byReason[failure.reason] || 0) + 1;
// oxlint-disable-next-line no-console
console.log(`\nleft untranslated: ${report.failures.length} ${JSON.stringify(byReason)}`);
