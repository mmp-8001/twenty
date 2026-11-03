import { timingSafeEqual } from 'crypto';

import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  PROOPCO_SYNC_ROUTE_PATH,
  PROOPCO_SYNC_TIMEOUT_SECONDS,
  PROOPCO_SYNC_TOKEN_HEADER,
} from 'src/constants/proopco-sync.constant';
import { PROOPCO_SYNC_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  type ProopcoSyncItem,
  type ProopcoSyncItemResult,
  type ProopcoSyncResponse,
} from 'src/logic-functions/types/proopco-sync.type';
import { parseProopcoSyncRequest } from 'src/logic-functions/utils/parse-proopco-sync-request.util';
import { processProopcoSyncItem } from 'src/logic-functions/utils/process-proopco-sync-item.util';

// Referenced records first, so a batch can carry a Trader and its Payment.
const TYPE_ORDER = { trader: 0, tradingAccount: 1, payment: 2 };

const isValidToken = (received: unknown): boolean => {
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

export const proopcoSyncHandler = async (
  routePayload: RoutePayload<unknown>,
): Promise<ProopcoSyncResponse> => {
  if (!isValidToken(routePayload.headers[PROOPCO_SYNC_TOKEN_HEADER])) {
    return { success: false, error: 'Invalid sync token' };
  }

  const request = parseProopcoSyncRequest(routePayload.body);

  if ('error' in request) {
    return { success: false, error: request.error };
  }

  const client = new CoreApiClient({ runAs: 'application' });
  const resultByItem = new Map<ProopcoSyncItem, ProopcoSyncItemResult>();
  const processingOrder = [...request.items].sort(
    (left, right) => TYPE_ORDER[left.type] - TYPE_ORDER[right.type],
  );

  for (const item of processingOrder) {
    resultByItem.set(item, await processProopcoSyncItem(client, item));
  }

  return {
    success: true,
    results: request.items.map((item) => resultByItem.get(item)!),
  };
};

export default defineLogicFunction({
  universalIdentifier: PROOPCO_SYNC_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-sync',
  description:
    'Upserts Traders, Trading Accounts and Payments pushed by proopco.',
  timeoutSeconds: PROOPCO_SYNC_TIMEOUT_SECONDS,
  handler: proopcoSyncHandler,
  httpRouteTriggerSettings: {
    path: PROOPCO_SYNC_ROUTE_PATH,
    httpMethod: 'POST',
    // Proopco has no Twenty credentials; the shared token is the guard.
    isAuthRequired: false,
  },
});
