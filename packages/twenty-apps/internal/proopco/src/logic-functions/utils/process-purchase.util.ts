import { isNonEmptyString } from '@sniptt/guards';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { isDefined } from 'twenty-sdk/utils';

import { commissionOf } from 'src/utils/commission.util';
import { personDisplayName } from 'src/logic-functions/utils/call-context.util';
import { closeDeal } from 'src/logic-functions/utils/close-deal.util';
import { readMoney } from 'src/logic-functions/utils/contact-upserted.util';
import {
  loadOpenDeal,
  personMirrorFields,
  type DealRow,
} from 'src/logic-functions/utils/deal.util';
import { loadEligibilityPlan } from 'src/logic-functions/utils/eligibility.util';
import { endOwnership } from 'src/logic-functions/utils/end-ownership.util';
import { happenedInClosedDeal } from 'src/logic-functions/utils/late-event.util';
import { type PlatformEvent } from 'src/logic-functions/utils/parse-platform-envelope.util';
import {
  createRecord,
  listRecords,
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { type EventOutcome } from 'src/logic-functions/utils/process-inbox-row.util';

type PurchaseContact = {
  id: string;
  name: { firstName: string; lastName: string } | null;
  lifecycleStage: string;
  ownerId: string | null;
  ownerMemberId: string | null;
};

type Attribution =
  | { kind: 'WON'; deal: DealRow }
  | { kind: 'VOID'; deal: DealRow }
  | { kind: 'RETENTION' }
  | { kind: 'NONE' };

const OWNED_STAGES_BY_DEAL_STAGE = ['IN_FOLLOW_UP', 'REBUY_WINDOW'];

const loadContact = async (client: RecordsClient, platformUserId: string) =>
  (
    await listRecords<PurchaseContact>(
      client,
      'people',
      { and: [{ platformUserId: { eq: platformUserId } }, { deletedAt: { is: 'NULL' } }] },
      { name: { firstName: true, lastName: true }, lifecycleStage: true, ownerId: true, ownerMemberId: true },
      1,
    )
  )[0] ?? null;

// A purchase at or after the open deal's deadline never wins it; the sweeper closes the deal.
const attribute = async (
  client: RecordsClient,
  contact: PurchaseContact,
  occurredAt: Date,
): Promise<Attribution> => {
  const deal = await loadOpenDeal(client, contact.id);

  if (isDefined(deal)) {
    if (occurredAt >= new Date(deal.deadlineAt)) {
      return { kind: 'NONE' };
    }

    return deal.dealStage === 'AWAITING_FIRST_CALL' ? { kind: 'VOID', deal } : { kind: 'WON', deal };
  }

  return contact.lifecycleStage === 'CUSTOMER' && isDefined(contact.ownerId)
    ? { kind: 'RETENTION' }
    : { kind: 'NONE' };
};

// false means the deal changed under us and the purchase must be attributed again against fresh state.
const applyAttribution = async (
  client: RecordsClient,
  contact: PurchaseContact,
  attribution: Attribution,
  amountUsdt: number,
  now: Date,
): Promise<boolean> => {
  if (attribution.kind === 'WON') {
    if (!(await closeDeal(client, attribution.deal, { dealStage: 'WON', amountUsdt }, now))) {
      return false;
    }

    await updateRecordsWhere(
      client,
      'People',
      { and: [{ id: { eq: contact.id } }, { lifecycleStage: { in: OWNED_STAGES_BY_DEAL_STAGE } }] },
      {
        lifecycleStage: 'CUSTOMER',
        ...personMirrorFields({ clock: null, dealTypeLabel: 'Retention', nextCallAt: null, now }),
      },
    );
  }

  if (attribution.kind === 'VOID') {
    const closed = await closeDeal(
      client,
      attribution.deal,
      { dealStage: 'VOID', closeReason: 'PURCHASED_BEFORE_CALL' },
      now,
    );

    if (!closed) {
      return false;
    }

    if (isDefined(contact.ownerId)) {
      await endOwnership({
        client,
        plan: await loadEligibilityPlan(client, new MetadataApiClient({ runAs: 'application' })),
        personId: contact.id,
        agentId: contact.ownerId,
        fromStage: 'AWAITING_FIRST_CALL',
        coolDownUntil: null,
        now,
      });
    }
  }

  return true;
};

// shortcut: the Purchase is written after the deal moves; a crash in between replays as a retention purchase, add an attribution marker on the deal if that ever shows up.
export const processPurchase = async (
  client: RecordsClient,
  event: PlatformEvent,
  now: Date,
): Promise<EventOutcome> => {
  const { platformPurchaseId, platformUserId, codeUsed } = event.data;

  if (!isNonEmptyString(platformPurchaseId) || !isNonEmptyString(platformUserId)) {
    throw new Error('platformPurchaseId and platformUserId are required');
  }

  const amountUsdt = readMoney(event.data, 'amountUsdt');
  const occurredAt = new Date(event.occurredAt);
  const duplicate = await listRecords(client, 'purchases', { platformPurchaseId: { eq: platformPurchaseId } }, {}, 1);

  if (duplicate.length > 0) {
    return 'processed';
  }

  let contact = await loadContact(client, platformUserId);

  if (!isDefined(contact)) {
    return 'waiting';
  }

  let attribution: Attribution = { kind: 'NONE' };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    attribution = await attribute(client, contact, occurredAt);

    if (await applyAttribution(client, contact, attribution, amountUsdt, now)) {
      break;
    }

    contact = (await loadContact(client, platformUserId)) ?? contact;
  }

  const credited = attribution.kind === 'WON' || attribution.kind === 'RETENTION';
  const ownerId = contact.ownerId;
  const ownerMemberId = contact.ownerMemberId;

  await createRecord(client, 'Purchase', {
    name: `${personDisplayName(contact.name)} · ${amountUsdt}`,
    platformPurchaseId,
    contactId: contact.id,
    occurredAt: occurredAt.toISOString(),
    amountUsdt,
    codeText: isNonEmptyString(codeUsed) ? codeUsed : null,
    dealId: 'deal' in attribution ? attribution.deal.id : null,
    creditedAgentId: credited ? ownerId : null,
    creditedAgentMemberId: credited ? ownerMemberId : null,
    commissionUsdt: credited ? commissionOf(amountUsdt) : null,
    contactOwnerId: attribution.kind === 'NONE' ? null : ownerId,
    contactOwnerMemberId: attribution.kind === 'NONE' ? null : ownerMemberId,
  });

  return attribution.kind === 'NONE' && (await happenedInClosedDeal(client, contact.id, event.occurredAt))
    ? 'needsReview'
    : 'processed';
};
