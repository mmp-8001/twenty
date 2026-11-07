import { describe, expect, it } from 'vitest';

import { canDeactivate, canFreeze, canManageOwnership } from 'src/utils/admin-permissions.util';

describe('canFreeze', () => {
  it.each([
    ['SUPERVISOR', 'SALES_ADMIN', true],
    ['FULL_ADMIN', 'SALES_ADMIN', true],
    ['SALES_ADMIN', 'SALES_ADMIN', false],
    ['SUPERVISOR', 'SUPERVISOR', false],
    ['FULL_ADMIN', 'SUPERVISOR', true],
    ['SUPERVISOR', 'FULL_ADMIN', false],
    ['FULL_ADMIN', 'FULL_ADMIN', false],
    [null, 'SALES_ADMIN', false],
  ] as const)('%s freezing %s is %s', (callerRole, targetRole, expected) => {
    expect(canFreeze({ callerId: 'a', callerRole, targetId: 'b', targetRole })).toBe(expected);
  });

  it('never lets anyone freeze themself', () => {
    expect(canFreeze({ callerId: 'a', callerRole: 'FULL_ADMIN', targetId: 'a', targetRole: 'SALES_ADMIN' })).toBe(false);
  });
});

describe('canManageOwnership and canDeactivate', () => {
  it('limits transfers to Supervisors and the Full Admin', () => {
    expect(canManageOwnership('SALES_ADMIN')).toBe(false);
    expect(canManageOwnership('SUPERVISOR')).toBe(true);
    expect(canManageOwnership('FULL_ADMIN')).toBe(true);
  });

  it('limits deactivation to the Full Admin and never themself', () => {
    expect(canDeactivate({ callerId: 'a', callerRole: 'SUPERVISOR', targetId: 'b' })).toBe(false);
    expect(canDeactivate({ callerId: 'a', callerRole: 'FULL_ADMIN', targetId: 'b' })).toBe(true);
    expect(canDeactivate({ callerId: 'a', callerRole: 'FULL_ADMIN', targetId: 'a' })).toBe(false);
  });
});
