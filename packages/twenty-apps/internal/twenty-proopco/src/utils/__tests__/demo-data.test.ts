import { describe, expect, it } from 'vitest';

import { FOLLOWUP_STATUSES, OWNERSHIP_STATES } from '../../constants/ownership.constant';
import { buildDemoSyncItems, DEMO_CASES, demoProopcoId, isDemoKey } from '../demo-data.util';

describe('demo data', () => {
  it('covers every case status and every ownership state', () => {
    expect(new Set(DEMO_CASES.map(({ followupStatus }) => followupStatus))).toEqual(new Set(FOLLOWUP_STATUSES));
    expect(new Set(DEMO_CASES.map(({ ownershipState }) => ownershipState))).toEqual(new Set(OWNERSHIP_STATES));
  });

  it('keeps case keys unique and only open cases carry a deadline or stay open', () => {
    expect(new Set(DEMO_CASES.map(({ key }) => key)).size).toBe(DEMO_CASES.length);

    for (const demoCase of DEMO_CASES) {
      expect(demoCase.deadlineInDays !== null && demoCase.endReason !== null).toBe(false);
    }
  });

  it('prefixes every synced proopco id, and adds a payment only for a purchase', () => {
    const purchaseItems = buildDemoSyncItems(DEMO_CASES.find(({ key }) => key === 'success')!, new Date());
    const plainItems = buildDemoSyncItems(DEMO_CASES.find(({ key }) => key === 'pending')!, new Date());

    expect(purchaseItems.map(({ type }) => type)).toEqual(['user', 'account', 'payment']);
    expect(plainItems.map(({ type }) => type)).toEqual(['user', 'account']);
    expect([...purchaseItems, ...plainItems].every(({ proopcoId }) => isDemoKey(proopcoId))).toBe(true);
  });

  it('matches only demo keys', () => {
    expect(isDemoKey(demoProopcoId('x'))).toBe(true);
    expect(isDemoKey('12345')).toBe(false);
    expect(isDemoKey('my-demo-1')).toBe(false);
    expect(isDemoKey(null)).toBe(false);
  });
});
