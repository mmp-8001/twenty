import { describe, expect, it } from 'vitest';

import { PROOPCO_SYNC_MAX_BATCH_SIZE } from 'src/constants/proopco-sync.constant';
import { parseProopcoSyncRequest } from 'src/logic-functions/utils/parse-proopco-sync-request.util';

describe('parseProopcoSyncRequest', () => {
  it('accepts a valid batch', () => {
    const item = { type: 'user', proopcoId: '1', data: {} };

    expect(parseProopcoSyncRequest({ items: [item] })).toEqual({
      entries: [{ item }],
    });
  });

  it.each([[undefined], [{}], [{ items: 'nope' }]])(
    'rejects the body %j',
    (body) => {
      expect(parseProopcoSyncRequest(body)).toHaveProperty('error');
    },
  );

  it('rejects a batch over the limit', () => {
    const items = Array.from({ length: PROOPCO_SYNC_MAX_BATCH_SIZE + 1 }, () => ({
      type: 'user',
      proopcoId: '1',
      data: {},
    }));

    expect(parseProopcoSyncRequest({ items })).toHaveProperty('error');
  });

  it.each([
    [{ type: 'order', proopcoId: '1', data: {} }, null, '1'],
    [{ type: 'user', proopcoId: '', data: {} }, 'user', null],
    [{ type: 'account', proopcoId: '1' }, 'account', '1'],
    ['not an object', null, null],
  ])('turns the malformed item %j into its own error', (item, type, proopcoId) => {
    const valid = { type: 'payment', proopcoId: '2', data: {} };
    const parsed = parseProopcoSyncRequest({ items: [item, valid] });

    expect(parsed).toEqual({
      entries: [
        {
          result: {
            type,
            proopcoId,
            status: 'error',
            reason: expect.any(String),
            retryable: false,
          },
        },
        { item: valid },
      ],
    });
  });
});
