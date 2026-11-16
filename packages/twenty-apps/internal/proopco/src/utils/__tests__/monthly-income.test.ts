import { describe, expect, it } from 'vitest';

import { planMonthlyIncomes } from 'src/utils/monthly-income.util';

const purchase = (id: string, occurredAt: string, commissionUsdt: number | null, creditedAgentId: string | null = 'A') => ({
  id,
  occurredAt,
  commissionUsdt,
  creditedAgentId,
  creditedAgentMemberId: creditedAgentId ? `${creditedAgentId}-member` : null,
});

describe('planMonthlyIncomes', () => {
  it('rolls Aban purchases into 1404-08 on 1 Azar and moves the marker to Aban', () => {
    const plan = planMonthlyIncomes(
      [purchase('p1', '2025-10-30T10:00:00Z', 12), purchase('p2', '2025-11-10T10:00:00Z', 8)],
      '1404-07',
      new Date('2025-11-21T21:30:00Z'),
    );

    expect(plan.marker).toBe('1404-08');
    expect(plan.groups).toEqual([
      { agentId: 'A', agentMemberId: 'A-member', jalaliMonth: '1404-08', purchaseIds: ['p1', 'p2'] },
    ]);
  });

  it('does nothing on a day of the same month the marker already covers', () => {
    const plan = planMonthlyIncomes([purchase('p1', '2025-10-30T10:00:00Z', 12)], '1404-08', new Date('2025-11-30T21:30:00Z'));

    expect(plan).toEqual({ marker: '1404-08', groups: [] });
  });

  it('puts a purchase that arrives after its month was rolled up into the next open month', () => {
    const plan = planMonthlyIncomes([purchase('late', '2025-10-30T10:00:00Z', 5)], '1404-08', new Date('2025-12-22T21:30:00Z'));

    expect(plan.groups).toEqual([{ agentId: 'A', agentMemberId: 'A-member', jalaliMonth: '1404-09', purchaseIds: ['late'] }]);
    expect(plan.marker).toBe('1404-09');
  });

  it('catches up every missed month in one run', () => {
    const plan = planMonthlyIncomes(
      [purchase('a', '2025-10-30T10:00:00Z', 1), purchase('b', '2025-11-30T10:00:00Z', 1)],
      '1404-07',
      new Date('2025-12-25T10:00:00Z'),
    );

    expect(plan.groups.map(({ jalaliMonth }) => jalaliMonth)).toEqual(['1404-08', '1404-09']);
    expect(plan.marker).toBe('1404-09');
  });

  it('crosses Esfand into Farvardin', () => {
    const plan = planMonthlyIncomes(
      [purchase('e', '2026-03-19T10:00:00Z', 3), purchase('f', '2026-03-21T10:00:00Z', 4)],
      '1404-11',
      new Date('2026-03-21T21:30:00Z'),
    );

    expect(plan.groups.map(({ jalaliMonth, purchaseIds }) => [jalaliMonth, purchaseIds])).toEqual([['1404-12', ['e']]]);
    expect(plan.marker).toBe('1404-12');

    const next = planMonthlyIncomes([purchase('f', '2026-03-21T10:00:00Z', 4)], plan.marker, new Date('2026-04-21T21:30:00Z'));

    expect(next.groups.map(({ jalaliMonth }) => jalaliMonth)).toEqual(['1405-01']);
  });

  it('skips unattributed and zero-commission purchases and makes no record for them', () => {
    const plan = planMonthlyIncomes(
      [purchase('n', '2025-10-30T10:00:00Z', 5, null), purchase('z', '2025-10-30T10:00:00Z', 0), purchase('x', '2025-10-30T10:00:00Z', null)],
      '1404-07',
      new Date('2025-11-21T21:30:00Z'),
    );

    expect(plan.groups).toEqual([]);
    expect(plan.marker).toBe('1404-08');
  });
});
