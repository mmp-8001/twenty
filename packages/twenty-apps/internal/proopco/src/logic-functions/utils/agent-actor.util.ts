import { isDefined } from 'twenty-sdk/utils';

import { Refusal } from 'src/logic-functions/utils/refusal.util';
import {
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

export type AgentActor = {
  memberId: string;
  agentId: string;
  name: string;
};

// Call work needs an active, unfrozen Agent linked to the caller; Full Admin has none.
export const loadAgentActor = async (
  client: RecordsClient,
  memberId: string | null,
): Promise<AgentActor> => {
  if (!isDefined(memberId)) {
    throw new Refusal(401, 'SIGN_IN_REQUIRED', 'Sign in required');
  }

  const [member] = await listRecords<{
    agent: { id: string; name: string; isActive: boolean; frozenSince: string | null } | null;
  }>(
    client,
    'workspaceMembers',
    { id: { eq: memberId } },
    { agent: { id: true, name: true, isActive: true, frozenSince: true } },
    1,
  );
  const agent = member?.agent;

  if (!isDefined(agent) || !agent.isActive) {
    throw new Refusal(403, 'NO_ACTIVE_AGENT', 'This user has no active agent.');
  }

  if (isDefined(agent.frozenSince)) {
    throw new Refusal(403, 'AGENT_FROZEN', 'This agent is frozen.');
  }

  return { memberId, agentId: agent.id, name: agent.name };
};
