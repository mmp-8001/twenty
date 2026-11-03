import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { SEND_CAMPAIGN_ROUTE_PATH } from 'src/constants/campaign.constant';
import { PROOPCO_SEND_CAMPAIGN_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { sendCampaign } from 'src/logic-functions/utils/send-campaign.util';

export const sendCampaignHandler = async (
  routePayload: RoutePayload<{ campaignId?: string }>,
) => {
  const campaignId = routePayload.body?.campaignId;

  if (!campaignId) {
    return { success: false, error: 'campaignId is required' };
  }

  return sendCampaign({
    client: new CoreApiClient({ runAs: 'application' }),
    campaignId,
  });
};

export default defineLogicFunction({
  universalIdentifier:
    PROOPCO_SEND_CAMPAIGN_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-send-campaign',
  description: 'Queues one SMS per Trader matching the Campaign Segment.',
  timeoutSeconds: 300,
  handler: sendCampaignHandler,
  httpRouteTriggerSettings: {
    path: SEND_CAMPAIGN_ROUTE_PATH,
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
