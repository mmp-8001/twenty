import { describe, expect, it } from 'vitest';

import { isRateLimitError } from 'src/logic-functions/utils/rate-limit-error.util';

describe('isRateLimitError', () => {
  it('recognises an HTTP 429 and a GraphQL RATE_LIMITED error', () => {
    const graphql = Object.assign(new Error('Rate limited'), { errors: [{ message: 'x', extensions: { code: 'RATE_LIMITED' } }] });

    expect(isRateLimitError(new Error('Too Many Requests: {"statusCode":429}'))).toBe(true);
    expect(isRateLimitError(graphql)).toBe(true);
  });

  it('leaves other failures counted', () => {
    const graphql = Object.assign(new Error('Bad'), { errors: [{ message: 'x', extensions: { code: 'BAD_USER_INPUT' } }] });

    expect([isRateLimitError(new Error('Contact not found')), isRateLimitError(graphql), isRateLimitError('Too Many Requests')]).toEqual([false, false, false]);
  });
});
