import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

type Catalog = Record<string, string | Record<string, string>>;

const readCatalog = (locale: string): Catalog =>
  JSON.parse(readFileSync(join(process.cwd(), 'locales', `${locale}.json`), 'utf8'));

const flatten = (catalog: Catalog) =>
  Object.entries(catalog).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [[key, value]]
      : Object.entries(value).map(([nested, text]) => [`${key}/${nested}`, text]),
  );

describe('fa-IR catalog', () => {
  it('translates every source string', () => {
    const untranslated = flatten(readCatalog('fa-IR'))
      .filter(([, text]) => text.trim() === '')
      .map(([key]) => key);

    expect(untranslated).toEqual([]);
  });

  it('covers every key the source catalog has', () => {
    const translated = new Set(flatten(readCatalog('fa-IR')).map(([key]) => key));
    const missing = flatten(readCatalog('en'))
      .map(([key]) => key)
      .filter((key) => !translated.has(key));

    expect(missing).toEqual([]);
  });
});
