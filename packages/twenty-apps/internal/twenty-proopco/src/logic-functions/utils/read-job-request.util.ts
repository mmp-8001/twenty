import { timingSafeEqual } from 'crypto';

import { type RoutePayload } from 'twenty-sdk/define';

import { PROOPCO_SYNC_TOKEN_HEADER } from 'src/constants/proopco-sync.constant';

export const isValidJobToken = (received: unknown): boolean => {
  const expected = process.env.PROOPCO_SYNC_TOKEN;

  if (typeof received !== 'string' || !expected) {
    return false;
  }

  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
};

const isRoutePayload = (payload: unknown): payload is RoutePayload<unknown> =>
  typeof payload === 'object' && payload !== null && 'requestContext' in payload;

// Workflow steps and cron pass the input directly; routes carry a body and
// the shared token, which is the only way tests can drive these jobs.
export const readJobInput = <TInput extends object>(
  payload: unknown,
): { input: Partial<TInput> } | { error: string } => {
  if (!isRoutePayload(payload)) {
    return { input: (payload ?? {}) as Partial<TInput> };
  }

  if (!isValidJobToken(payload.headers[PROOPCO_SYNC_TOKEN_HEADER])) {
    return { error: 'Invalid sync token' };
  }

  return { input: (payload.body ?? {}) as Partial<TInput> };
};
