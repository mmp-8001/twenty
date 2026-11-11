import { describe, expect, it } from 'vitest';

import { commissionOf } from 'src/utils/commission.util';
import { rebuyWindowProgressOf } from 'src/utils/deal-clock.util';

describe('commissionOf', () => {
  it('takes 2% rounded half up to the cent', () => {
    expect(commissionOf(500)).toBe(10);
    expect(commissionOf(300)).toBe(6);
    expect(commissionOf(250.25)).toBe(5.01);
    expect(commissionOf(0.25)).toBe(0.01);
    expect(commissionOf(0)).toBe(0);
  });
});

describe('rebuyWindowProgressOf', () => {
  it('counts whole hours left and stops at zero', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');

    expect(rebuyWindowProgressOf(new Date('2026-01-04T00:00:00.000Z'), now)).toBe('72h left');
    expect(rebuyWindowProgressOf(new Date('2026-01-01T00:30:00.000Z'), now)).toBe('1h left');
    expect(rebuyWindowProgressOf(new Date('2025-12-31T00:00:00.000Z'), now)).toBe('0h left');
  });
});
