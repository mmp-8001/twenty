import { SWEEPER_BATCH_SIZE } from 'src/constants/platform-events.constant';
import { DAY_MS } from 'src/constants/time.constant';
import { closeDeal } from 'src/logic-functions/utils/close-deal.util';
import { OPEN_DEAL_STAGES } from 'src/logic-functions/utils/deal.util';
import { type EligibilityPlan } from 'src/logic-functions/utils/eligibility.util';
import { endOwnership } from 'src/logic-functions/utils/end-ownership.util';
import {
  loadFrozenAgentIds,
  loadSettings,
  notOwnedBy,
} from 'src/logic-functions/utils/load-settings.util';
import {
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

type ExpiredDeal = {
  id: string;
  dealStage: string;
  dealType: string;
  deadlineAt: string;
  agentId: string;
  pointOfContactId: string;
  sourceCampaign: { cooldownDays: number | null } | null;
};

const EXPIRY = {
  AWAITING_FIRST_CALL: { closeReason: 'UNANSWERED_AT_FIRST_CALL', coolsDown: false },
  IN_FOLLOW_UP: { closeReason: 'EXPIRED', coolsDown: true },
  REBUY_WINDOW: { closeReason: 'ABANDONED_IN_72H', coolsDown: false },
} as const;

// Step 1: close deals whose deadline passed more than the grace ago.
export const closeExpiredDeals = async (
  client: RecordsClient,
  plan: EligibilityPlan,
  now: Date,
): Promise<number> => {
  const settings = await loadSettings(client);
  const cutoff = new Date(now.getTime() - settings.lateEventGraceMinutes * 60_000);
  const deals = await listRecords<ExpiredDeal>(
    client,
    'opportunities',
    {
      and: [
        { openDealKey: { is: 'NOT_NULL' } },
        { dealStage: { in: OPEN_DEAL_STAGES } },
        { deadlineAt: { lt: cutoff.toISOString() } },
        ...notOwnedBy('agentId', await loadFrozenAgentIds(client)),
      ],
    },
    {
      dealStage: true,
      dealType: true,
      deadlineAt: true,
      agentId: true,
      pointOfContactId: true,
      sourceCampaign: { cooldownDays: true },
    },
    SWEEPER_BATCH_SIZE,
  );
  let closed = 0;

  for (const deal of deals) {
    const outcome = EXPIRY[deal.dealStage as keyof typeof EXPIRY];

    if (!(await closeDeal(client, deal, { dealStage: 'LOST', closeReason: outcome.closeReason }, now))) {
      continue;
    }

    closed += 1;

    const cooldownDays =
      deal.dealType === 'REBUY'
        ? settings.rebuyCooldownDays
        : (deal.sourceCampaign?.cooldownDays ?? 0);

    await endOwnership({
      client,
      plan,
      personId: deal.pointOfContactId,
      agentId: deal.agentId,
      fromStage: deal.dealStage,
      coolDownUntil: outcome.coolsDown ? new Date(now.getTime() + cooldownDays * DAY_MS) : null,
      now,
    });
  }

  return closed;
};
