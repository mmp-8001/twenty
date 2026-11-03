import { describe, expect, it } from 'vitest';

import { normalizePhone } from 'src/logic-functions/utils/normalize-phone.util';

describe('normalizePhone', () => {
  it.each([
    ['+44 1234 567890', '+441234567890'],
    ['+1 (415) 555-0132', '+14155550132'],
  ])('normalizes %s', (raw, expected) => {
    expect(normalizePhone(raw)).toBe(expected);
  });

  it.each(['07123456789', '+0123456789', '+12', 'abc', '+44123456789012345'])(
    'rejects %s',
    (raw) => {
      expect(normalizePhone(raw)).toBeUndefined();
    },
  );
});
