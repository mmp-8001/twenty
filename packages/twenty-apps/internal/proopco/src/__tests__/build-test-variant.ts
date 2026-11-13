import { cpSync, existsSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  TEST_APPLICATION_UNIVERSAL_IDENTIFIER,
  TEST_VARIANT_DIRECTORY,
} from './test-constants';

const APP_ROOT = resolve(__dirname, '../..');
const COPIED_ENTRIES = ['package.json', 'yarn.lock', 'tsconfig.json', '.yarnrc.yml', '.nvmrc', 'src', 'locales'];

const rewrite = (path: string, replacements: [string | RegExp, string][]) => {
  let content = readFileSync(path, 'utf8');

  for (const [pattern, replacement] of replacements) {
    const next = content.replace(pattern, replacement);

    if (next === content) {
      throw new Error(`Test variant: ${String(pattern)} not found in ${path}`);
    }

    content = next;
  }

  writeFileSync(path, content);
};

export const buildTestVariant = (): string => {
  const variantRoot = join(APP_ROOT, TEST_VARIANT_DIRECTORY);

  rmSync(variantRoot, { recursive: true, force: true });

  for (const entry of COPIED_ENTRIES) {
    if (existsSync(join(APP_ROOT, entry))) {
      cpSync(join(APP_ROOT, entry), join(variantRoot, entry), {
        recursive: true,
        filter: (source) => !source.includes('__tests__'),
      });
    }
  }

  symlinkSync(join(APP_ROOT, 'node_modules'), join(variantRoot, 'node_modules'));

  rewrite(join(variantRoot, 'src/constants/universal-identifiers.ts'), [
    [APPLICATION_UNIVERSAL_IDENTIFIER, TEST_APPLICATION_UNIVERSAL_IDENTIFIER],
    ["'Proopco CRM'", "'Proopco CRM (test variant)'"],
  ]);
  // Cron and database triggers fire on their own clock and on every write; tests call the handlers instead.
  const logicFunctionsDirectory = join(variantRoot, 'src/logic-functions');

  const logicFunctionFiles = readdirSync(logicFunctionsDirectory).filter((entry) => entry.endsWith('.ts'));

  for (const file of logicFunctionFiles) {
    const path = join(logicFunctionsDirectory, file);
    const source = readFileSync(path, 'utf8');
    const stripped = source.replace(
      /\n\s*(?:cron|databaseEvent)TriggerSettings: \{[^}]*\},/g,
      '',
    );

    if (stripped !== source) {
      writeFileSync(path, stripped);
    }
  }

  return variantRoot;
};
