import { describe, expect, it } from 'vitest';

import { parseProopcoSyncRequest } from 'src/logic-functions/utils/parse-proopco-sync-request.util';

describe('parseProopcoSyncRequest', () => {
  it('accepts a valid batch', () => {
    const items = [{ type: 'trader', proopcoId: '1', data: {} }];

    expect(parseProopcoSyncRequest({ items })).toEqual({ items });
  });

  it.each([
    [undefined],
    [{}],
    [{ items: [{ type: 'order', proopcoId: '1', data: {} }] }],
    [{ items: [{ type: 'trader', proopcoId: '', data: {} }] }],
    [{ items: [{ type: 'trader', proopcoId: '1' }] }],
  ])('rejects %j', (body) => {
    expect(parseProopcoSyncRequest(body)).toHaveProperty('error');
  });
});
