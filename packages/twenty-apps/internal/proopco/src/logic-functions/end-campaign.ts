import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';
import { Response } from 'twenty-sdk/logic-function';

import {
  END_CAMPAIGN_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import {
  endCampaignNow,
  runEligibilityRefresh,
} from 'src/logic-functions/utils/refresh-eligibility.util';
import { resolveCallerRoleIdentifiers } from 'src/logic-functions/utils/resolve-caller.util';

const failure = (status: number, message: string) =>
  new Response({ error: { message } }, { status });

export const handleEndCampaign = async (routePayload: RoutePayload<unknown>) => {
  const roleIdentifiers = await resolveCallerRoleIdentifiers(routePayload);

  if (roleIdentifiers === null) {
    return failure(401, 'Sign in required');
  }

  if (
    ![SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER, FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER].some(
      (identifier) => roleIdentifiers.includes(identifier),
    )
  ) {
    return failure(403, 'Only a Supervisor or Full Admin can end a campaign');
  }

  const campaignId = (routePayload.body as { campaignId?: unknown } | null)?.campaignId;

  if (typeof campaignId !== 'string') {
    return failure(400, 'campaignId is required');
  }

  const { client, metadata } = applicationClients();

  try {
    const now = new Date();

    await endCampaignNow(client, campaignId, now);
    await runEligibilityRefresh(now, client, metadata);
  } catch (error) {
    return failure(404, error instanceof Error ? error.message : 'Campaign not found');
  }

  return new Response({ ended: true });
};

export default defineLogicFunction({
  universalIdentifier: END_CAMPAIGN_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'end-campaign',
  description: 'End now: ends a campaign today and removes its contacts from user lists.',
  timeoutSeconds: 120,
  handler: handleEndCampaign,
  httpRouteTriggerSettings: {
    path: '/campaigns/end',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
