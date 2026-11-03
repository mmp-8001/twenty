import { describe, expect, it } from 'vitest';

import { buildActiveTraderKey } from 'src/logic-functions/utils/build-active-trader-key.util';

describe('buildActiveTraderKey', () => {
  it.each(['PENDING', 'RETRY_PENDING'] as const)('keys a %s Followup by Trader', (stage) => {
    expect(buildActiveTraderKey({ stage, traderId: 't1' })).toBe('t1');
  });

  it.each(['SUCCEEDED', 'FAILED', 'EXPIRED'] as const)('frees the key of a %s Followup', (stage) => {
    expect(buildActiveTraderKey({ stage, traderId: 't1' })).toBeNull();
  });
});
