import { describe, expect, it } from 'vitest';

import {
  buildSelection,
  isSameValue,
} from 'src/logic-functions/utils/is-same-fields.util';

describe('isSameValue', () => {
  it('ignores stored fields we do not write', () => {
    expect(
      isSameValue(
        { name: { firstName: 'Ada' } },
        { name: { firstName: 'Ada', lastName: 'L' }, id: 'x' },
      ),
    ).toBe(true);
  });

  it('treats a numeric string from the API as equal to a number', () => {
    expect(
      isSameValue({ amountMicros: 5_000_000 }, { amountMicros: '5000000' }),
    ).toBe(true);
  });

  it('compares date-times as instants', () => {
    expect(
      isSameValue('2026-01-02T03:04:05.000Z', '2026-01-02T03:04:05Z'),
    ).toBe(true);
    expect(
      isSameValue('2026-01-02T03:04:05.000Z', '2026-01-02T03:04:06Z'),
    ).toBe(false);
  });

  it('detects a changed array and a cleared value', () => {
    expect(isSameValue(['a'], ['a', 'b'])).toBe(false);
    expect(isSameValue(null, 'x')).toBe(false);
    expect(isSameValue(null, null)).toBe(true);
  });
});

describe('buildSelection', () => {
  it('selects nested composite keys', () => {
    expect(buildSelection({ a: 1, b: { c: 'x' }, d: [] })).toEqual({
      a: true,
      b: { c: true },
      d: true,
    });
  });
});
