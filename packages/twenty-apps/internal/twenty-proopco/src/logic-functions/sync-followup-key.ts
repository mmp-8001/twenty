import { CoreApiClient } from 'twenty-client-sdk/core';
import {
  defineLogicFunction,
  type DatabaseEventPayload,
  type ObjectRecordBaseEvent,
} from 'twenty-sdk/define';

import { type FollowupStage } from 'src/constants/followup.constant';
import { PROOPCO_FOLLOWUP_KEY_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { buildActiveTraderKey } from 'src/logic-functions/utils/build-active-trader-key.util';
import {
  listRecords,
  updateRecord,
} from 'src/logic-functions/utils/list-records.util';

type FollowupKeyNode = {
  stage: FollowupStage;
  traderId: string | null;
  activeTraderKey: string | null;
};

// Keeps the key in step when a stage is edited outside the app's own commands.
export const syncFollowupKeyHandler = async (
  event: DatabaseEventPayload<ObjectRecordBaseEvent>,
) => {
  const client = new CoreApiClient({ runAs: 'application' });
  const [followup] = await listRecords<FollowupKeyNode>(
    client,
    'followups',
    { id: { eq: event.recordId } },
    { stage: true, traderId: true, activeTraderKey: true },
  );

  if (!followup) {
    return { updated: false };
  }

  const activeTraderKey = buildActiveTraderKey(followup);

  if (activeTraderKey === followup.activeTraderKey) {
    return { updated: false };
  }

  await updateRecord(client, 'Followup', event.recordId, { activeTraderKey });

  return { updated: true };
};

export default defineLogicFunction({
  universalIdentifier: PROOPCO_FOLLOWUP_KEY_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'proopco-sync-followup-key',
  description: 'Keeps a Followup active-trader key in step with its stage.',
  timeoutSeconds: 30,
  handler: syncFollowupKeyHandler,
  databaseEventTriggerSettings: { eventName: 'followup.updated' },
});
