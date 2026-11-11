import { recomputeContactEligibility, type EligibilityPlan } from 'src/logic-functions/utils/eligibility.util';
import { personMirrorFields } from 'src/logic-functions/utils/deal.util';
import { recountOwnedContacts } from 'src/logic-functions/utils/recount-owned-contacts.util';
import {
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

// Ends an agent's ownership of a contact whose deal just closed; false means the contact had already moved on.
export const endOwnership = async ({
  client,
  plan,
  personId,
  agentId,
  fromStage,
  coolDownUntil,
  now,
}: {
  client: RecordsClient;
  plan: EligibilityPlan;
  personId: string;
  agentId: string;
  fromStage: string;
  coolDownUntil: Date | null;
  now: Date;
}): Promise<boolean> => {
  const written = await updateRecordsWhere(
    client,
    'People',
    {
      and: [
        { id: { eq: personId } },
        { ownerId: { eq: agentId } },
        { lifecycleStage: { eq: fromStage } },
      ],
    },
    {
      ownerId: null,
      ownerMemberId: null,
      ownedSince: null,
      lifecycleStage: coolDownUntil === null ? 'FREE' : 'COOL_DOWN',
      cooldownUntil: coolDownUntil?.toISOString() ?? null,
      ...personMirrorFields({
        clock: null,
        dealTypeLabel: null,
        sourceCampaignId: null,
        nextCallAt: null,
        now,
      }),
    },
  );

  if (written.length === 0) {
    return false;
  }

  await recomputeContactEligibility(client, plan, personId);
  await recountOwnedContacts(client, agentId);

  return true;
};
