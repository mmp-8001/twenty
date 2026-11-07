import { describe, expect, it } from 'vitest';

import { buildIncomeKey, fromMicros, groupCommissionsByAdmin } from 'src/utils/monthly-income.util';

describe('groupCommissionsByAdmin', () => {
  it('sums per admin exactly and skips commissions without an admin', () => {
    const groups = groupCommissionsByAdmin([
      { id: 'a', adminId: 'x', commissionUsdt: 10 },
      { id: 'b', adminId: 'x', commissionUsdt: 6 },
      { id: 'c', adminId: 'x', commissionUsdt: 4 },
      { id: 'd', adminId: 'y', commissionUsdt: 0.1 },
      { id: 'e', adminId: 'y', commissionUsdt: 0.2 },
      { id: 'f', adminId: null, commissionUsdt: 99 },
    ]);

    expect(fromMicros(groups.get('x')!.micros)).toBe(20);
    expect(groups.get('x')!.ids).toEqual(['a', 'b', 'c']);
    expect(fromMicros(groups.get('y')!.micros)).toBe(0.3);
    expect(groups.size).toBe(2);
  });

  it('keys an income by admin and Jalali month', () => {
    expect(buildIncomeKey('x', 1403, 8)).toBe('x:1403-8');
  });
});
