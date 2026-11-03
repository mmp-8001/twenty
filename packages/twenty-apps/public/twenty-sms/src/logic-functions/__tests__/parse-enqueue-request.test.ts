import { describe, expect, it } from 'vitest';

import { parseEnqueueRequest } from 'src/logic-functions/utils/parse-enqueue-request.util';

describe('parseEnqueueRequest', () => {
  it('accepts well-formed messages', () => {
    const messages = [{ to: '+441234567890', body: 'Hi', sourceRef: 'a' }];

    expect(parseEnqueueRequest({ messages })).toEqual({ messages });
  });

  it.each([
    [null],
    [{}],
    [{ messages: [] }],
    [{ messages: [{ to: '+441234567890', body: 'Hi' }] }],
    [{ messages: [{ to: '+441234567890', body: '', sourceRef: 'a' }] }],
  ])('rejects %j', (body) => {
    expect(parseEnqueueRequest(body)).toHaveProperty('error');
  });
});
