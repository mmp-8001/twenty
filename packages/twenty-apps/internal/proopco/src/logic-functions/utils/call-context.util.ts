import { isDefined } from 'twenty-sdk/utils';

import { type AgentActor } from 'src/logic-functions/utils/agent-actor.util';
import {
  clockOfDeal,
  loadOpenDeal,
  type DealRow,
} from 'src/logic-functions/utils/deal.util';
import {
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';
import { type DealClock } from 'src/utils/deal-clock.util';

export type CallContactRow = {
  id: string;
  name: { firstName: string; lastName: string } | null;
  lifecycleStage: string;
  ownerId: string | null;
  callUrgency: string | null;
  sourceCampaignId: string | null;
};

export type CallContext = {
  person: CallContactRow;
  kind: 'FOLLOW_UP' | 'RETENTION';
  deal: DealRow | null;
  clock: DealClock | null;
};

export const personDisplayName = (name: CallContactRow['name']) =>
  `${name?.firstName ?? ''} ${name?.lastName ?? ''}`.trim();

const CALLABLE_STAGES = ['AWAITING_FIRST_CALL', 'IN_FOLLOW_UP', 'CUSTOMER'];

// Every Log call refusal lives here so the form options and the save apply the same rules.
export const loadCallContext = async (
  client: RecordsClient,
  actor: AgentActor,
  personId: string,
  now: Date,
): Promise<CallContext> => {
  const [person] = await listRecords<CallContactRow>(
    client,
    'people',
    { and: [{ id: { eq: personId } }, { deletedAt: { is: 'NULL' } }] },
    {
      name: { firstName: true, lastName: true },
      lifecycleStage: true,
      ownerId: true,
      callUrgency: true,
      sourceCampaignId: true,
    },
    1,
  );

  if (!isDefined(person)) {
    throw new Refusal(404, 'CONTACT_NOT_FOUND', 'Contact not found.');
  }

  if (person.ownerId !== actor.agentId) {
    throw new Refusal(403, 'NOT_OWNER', 'You can only call contacts you follow up.');
  }

  if (person.lifecycleStage === 'REBUY_WINDOW') {
    throw new Refusal(422, 'REBUY_ADD_FIRST', 'Add this contact to your follow-ups first.');
  }

  if (!CALLABLE_STAGES.includes(person.lifecycleStage)) {
    throw new Refusal(422, 'STAGE_NOT_CALLABLE', 'This contact cannot be called now.');
  }

  if (person.lifecycleStage === 'CUSTOMER') {
    return { person, kind: 'RETENTION', deal: null, clock: null };
  }

  const deal = await loadOpenDeal(client, personId);

  if (!isDefined(deal)) {
    throw new Refusal(409, 'NO_OPEN_DEAL', 'This contact has no open deal.');
  }

  if (new Date(deal.deadlineAt) <= now) {
    throw new Refusal(409, 'FOLLOW_UP_ENDED', 'This follow-up has ended.');
  }

  return { person, kind: 'FOLLOW_UP', deal, clock: clockOfDeal(deal) };
};
