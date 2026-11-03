import { describe, expect, it } from 'vitest';

import { parseNpmPackOutputOrThrow } from '@/app/publish/parse-npm-pack-output-or-throw';

const PACKED = {
  name: 'billing',
  version: '1.0.0',
  filename: 'billing-1.0.0.tgz',
  files: [{ path: 'package.json' }],
};

describe('parseNpmPackOutputOrThrow', () => {
  it('reads the array printed by npm 11 and older', () => {
    expect(parseNpmPackOutputOrThrow(JSON.stringify([PACKED]))).toEqual(PACKED);
  });

  it('reads the object keyed by package name printed by npm 12', () => {
    expect(
      parseNpmPackOutputOrThrow(JSON.stringify({ billing: PACKED })),
    ).toEqual(PACKED);
  });
});
