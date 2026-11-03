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
import { moveFollowupToRetry } from 'src/logic-functions/utils/move-followup-to-retry.util';
import { readRetryWindowDays } from 'src/logic-functions/utils/read-app-settings.util';
import { isValidJobToken } from 'src/logic-functions/utils/read-job-request.util';
import { parseProopcoSyncRequest } from 'src/logic-functions/utils/parse-proopco-sync-request.util';
import { processProopcoSyncItem } from 'src/logic-functions/utils/process-proopco-sync-item.util';

// Referenced records first, so a batch can carry a Trader and its Payment.
const TYPE_ORDER = { trader: 0, tradingAccount: 1, payment: 2 };

export const proopcoSyncHandler = async (
  routePayload: RoutePayload<unknown>,
): Promise<ProopcoSyncResponse> => {
  if (!isValidJobToken(routePayload.headers[PROOPCO_SYNC_TOKEN_HEADER])) {
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
    let result = await processProopcoSyncItem(client, item);

    // Also on unchanged, so a resend repairs a hook that failed before.
    if (
      item.type === 'tradingAccount' &&
      result.status !== 'error' &&
      String(item.data.status).toLowerCase() === 'failed'
    ) {
      try {
        await moveFollowupToRetry({
          client,
          tradingAccountProopcoId: item.proopcoId,
          retryWindowDays: readRetryWindowDays(),
          now: new Date(),
        });
      } catch (error) {
        result = {
          type: item.type,
          proopcoId: item.proopcoId,
          status: 'error',
          reason: error instanceof Error ? error.message : String(error),
          retryable: true,
        };
      }
    }

    resultByItem.set(item, result);
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
    forwardedRequestHeaders: [PROOPCO_SYNC_TOKEN_HEADER],
  },
});
