import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import {
  PROOPCO_SYNC_ROUTE_PATH,
  PROOPCO_SYNC_TIMEOUT_SECONDS,
  PROOPCO_SYNC_TOKEN_HEADER,
} from 'src/constants/proopco-sync.constant';
import { PROOPCO_SYNC_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  type ProopcoSyncItemResult,
  type ProopcoSyncResponse,
} from 'src/logic-functions/types/proopco-sync.type';
import { isValidJobToken } from 'src/logic-functions/utils/read-job-request.util';
import { parseProopcoSyncRequest } from 'src/logic-functions/utils/parse-proopco-sync-request.util';
import { detectLostLastAccount } from 'src/logic-functions/utils/detect-lost-account.util';
import { detectPurchase } from 'src/logic-functions/utils/detect-purchase.util';
import { recomputeVisibility } from 'src/logic-functions/utils/recompute-visibility.util';
import { processProopcoSyncItem } from 'src/logic-functions/utils/process-proopco-sync-item.util';

// Referenced records first, so a batch can carry a User and its Payment.
const TYPE_ORDER = { user: 0, account: 1, payment: 2 };

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
  const results = new Map<number, ProopcoSyncItemResult>();
  const processingOrder = request.entries
    .flatMap((entry, index) => ('item' in entry ? [{ item: entry.item, index }] : []))
    .sort((left, right) => TYPE_ORDER[left.item.type] - TYPE_ORDER[right.item.type]);

  request.entries.forEach((entry, index) => {
    if ('result' in entry) {
      results.set(index, entry.result);
    }
  });

  const changedPersonIds: string[] = [];

  for (const { item, index } of processingOrder) {
    const result = await processProopcoSyncItem(client, item, (personId) =>
      changedPersonIds.push(personId),
    );

    results.set(index, result);

    if (result.status === 'error' || (item.type !== 'payment' && item.type !== 'account')) {
      continue;
    }

    // Also on unchanged, so a resend repairs a hook that failed before.
    try {
      if (item.type === 'payment') {
        await detectPurchase({ client, paymentProopcoId: item.proopcoId });
      } else {
        await detectLostLastAccount({ client, accountProopcoId: item.proopcoId });
      }
    } catch (error) {
      results.set(index, {
        type: item.type,
        proopcoId: item.proopcoId,
        status: 'error',
        reason: `Saved, but its follow-up step failed: ${String(error)}`,
        retryable: true,
      });
    }
  }

  try {
    await recomputeVisibility({ client, personIds: changedPersonIds });
  } catch (error) {
    // The sync result stays valid; the hourly recompute repairs the lists.
    console.error(`Visibility recompute after sync failed: ${String(error)}`);
  }

  return {
    success: true,
    results: request.entries.map((_, index) => results.get(index)!),
  };
};

export default defineLogicFunction({
  universalIdentifier: PROOPCO_SYNC_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-sync',
  description:
    'Upserts Users, Challenge Accounts and Payments pushed by proopco.',
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
