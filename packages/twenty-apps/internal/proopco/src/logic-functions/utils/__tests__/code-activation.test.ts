import { describe, expect, it } from 'vitest';

import { assertCodeUsable, renderSmsTemplate } from 'src/logic-functions/utils/code-activation.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';

const NOW = new Date('2026-12-01T00:00:00Z');

describe('renderSmsTemplate', () => {
  it('fills the code, the capability and the Jalali Tehran expiry', () => {
    expect(
      renderSmsTemplate('{code} ({capability}) until {expiry}; {code}', {
        code: 'RESET50',
        capability: 'TWO_STEP_PAYMENT',
        expiresAt: new Date('2026-12-21T20:29:59Z'),
      }),
    ).toBe('RESET50 (پرداخت دو مرحله‌ای) until 1405/09/30 23:59; RESET50');
  });
});

describe('assertCodeUsable', () => {
  it('accepts an active code before its expiry', () => {
    expect(() => assertCodeUsable({ isActive: true, expiresAt: '2026-12-02T00:00:00Z' }, NOW)).not.toThrow();
  });

  it.each([
    [{ isActive: false, expiresAt: '2026-12-02T00:00:00Z' }, 'CODE_DEACTIVATED'],
    [{ isActive: true, expiresAt: '2026-12-01T00:00:00Z' }, 'CODE_EXPIRED'],
  ])('refuses %j', (code, expected) => {
    try {
      assertCodeUsable(code, NOW);
    } catch (error) {
      expect(error).toBeInstanceOf(Refusal);
      expect((error as Refusal).code).toBe(expected);

      return;
    }

    throw new Error('Expected a refusal');
  });
});
