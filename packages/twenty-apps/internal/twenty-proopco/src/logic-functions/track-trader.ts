import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { type LogicFunctionExecutionContext } from 'twenty-sdk/logic-function';

import { TRACK_ROUTE_PATH } from 'src/constants/proopco-jobs.constant';
import { PROOPCO_SYNC_TOKEN_HEADER } from 'src/constants/proopco-sync.constant';
import { PROOPCO_TRACK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { isValidJobToken } from 'src/logic-functions/utils/read-job-request.util';
import { trackTrader } from 'src/logic-functions/utils/track-trader.util';

type TrackInput = {
  traderId: string;
  followupTypeId: string;
  ownerId: string;
};

export const trackTraderHandler = async (
  routePayload: RoutePayload<TrackInput>,
  context: LogicFunctionExecutionContext,
) => {
  const body: Partial<TrackInput> = routePayload.body ?? {};

  if (!body.traderId) {
    return { success: false, error: 'traderId is required' };
  }

  // Only a token call may name the owner; agents Track as themselves.
  const ownerId = isValidJobToken(routePayload.headers[PROOPCO_SYNC_TOKEN_HEADER])
    ? body.ownerId
    : context.workspaceMemberId;

  if (!ownerId) {
    return { success: false, error: 'Only a workspace member can Track a Trader' };
  }

  return trackTrader({
    client: new CoreApiClient({ runAs: 'application' }),
    traderId: body.traderId,
    ownerId,
    followupTypeId: body.followupTypeId,
    now: new Date(),
  });
};

export default defineLogicFunction({
  universalIdentifier: PROOPCO_TRACK_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-track',
  description: 'Creates a Pending Followup for a Trader, owned by the caller.',
  timeoutSeconds: 30,
  handler: trackTraderHandler,
  httpRouteTriggerSettings: {
    path: TRACK_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
    forwardedRequestHeaders: [PROOPCO_SYNC_TOKEN_HEADER],
  },
});
