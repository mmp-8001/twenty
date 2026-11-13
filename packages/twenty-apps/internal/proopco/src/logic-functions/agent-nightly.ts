import { defineLogicFunction } from 'twenty-sdk/define';

import { AGENT_NIGHTLY_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { flagRoleMismatches } from 'src/logic-functions/utils/agent-lifecycle.util';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { refreshFreezePeriods } from 'src/logic-functions/utils/freeze-agent.util';

export const runAgentNightly = async (now: Date) => {
  const { client, metadata } = applicationClients();

  return {
    freezePeriods: await refreshFreezePeriods(client, now),
    roleMismatches: await flagRoleMismatches({ client, metadata }, now),
  };
};

// 20:35 UTC is 00:05 Tehran, just after the Tehran day turns.
export default defineLogicFunction({
  universalIdentifier: AGENT_NIGHTLY_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'agent-nightly',
  description: 'Nightly: counts frozen days, tags long freezes and flags agents whose role and status disagree.',
  timeoutSeconds: 120,
  handler: () => runAgentNightly(new Date()),
  cronTriggerSettings: { pattern: '35 20 * * *' },
});
