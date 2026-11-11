import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-sdk/utils';

import { HOUR_MS } from 'src/constants/time.constant';
import { personDisplayName } from 'src/logic-functions/utils/call-context.util';
import {
  loadOpenDeal,
  personMirrorFields,
} from 'src/logic-functions/utils/deal.util';
import { happenedInClosedDeal } from 'src/logic-functions/utils/late-event.util';
import { loadSettings } from 'src/logic-functions/utils/load-settings.util';
import { type PlatformEvent } from 'src/logic-functions/utils/parse-platform-envelope.util';
import { type EventOutcome } from 'src/logic-functions/utils/process-inbox-row.util';
import {
  createRecord,
  listRecords,
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

// Only a Customer's last lost account opens a rebuy; every other stage ignores it.
export const processAccountLastLost = async (
  client: RecordsClient,
  event: PlatformEvent,
  now: Date,
): Promise<EventOutcome> => {
  const { platformUserId } = event.data;

  if (!isNonEmptyString(platformUserId)) {
    throw new Error('platformUserId is required');
  }

  const [contact] = await listRecords<{
    id: string;
    name: { firstName: string; lastName: string } | null;
    lifecycleStage: string;
    ownerId: string | null;
    ownerMemberId: string | null;
  }>(
    client,
    'people',
    { and: [{ platformUserId: { eq: platformUserId } }, { deletedAt: { is: 'NULL' } }] },
    { name: { firstName: true, lastName: true }, lifecycleStage: true, ownerId: true, ownerMemberId: true },
    1,
  );

  if (!isDefined(contact)) {
    return 'waiting';
  }

  if (contact.lifecycleStage !== 'CUSTOMER' || !isDefined(contact.ownerId)) {
    return (await happenedInClosedDeal(client, contact.id, event.occurredAt)) ? 'needsReview' : 'processed';
  }

  const settings = await loadSettings(client);
  const occurredAt = new Date(event.occurredAt);
  const deadlineAt = new Date(occurredAt.getTime() + settings.rebuyWindowHours * HOUR_MS);

  try {
    await createRecord(client, 'Opportunity', {
      name: `${personDisplayName(contact.name)} · Rebuy`,
      pointOfContactId: contact.id,
      dealType: 'REBUY',
      dealStage: 'REBUY_WINDOW',
      openDealKey: contact.id,
      openedAt: occurredAt.toISOString(),
      deadlineAt: deadlineAt.toISOString(),
      agentId: contact.ownerId,
      agentMemberId: contact.ownerMemberId,
      contactOwnerId: contact.ownerId,
      contactOwnerMemberId: contact.ownerMemberId,
    });
  } catch (error) {
    // The unique open-deal key means an earlier attempt already opened it.
    if ((await loadOpenDeal(client, contact.id))?.dealStage !== 'REBUY_WINDOW') {
      throw error;
    }
  }

  await updateRecordsWhere(
    client,
    'People',
    { and: [{ id: { eq: contact.id } }, { lifecycleStage: { eq: 'CUSTOMER' } }] },
    {
      lifecycleStage: 'REBUY_WINDOW',
      ...personMirrorFields({
        clock: null,
        rebuyWindowDeadlineAt: deadlineAt,
        dealTypeLabel: 'Rebuy',
        nextCallAt: null,
        now,
      }),
    },
  );

  // A frozen owner's rebuy window is paused like the rest of their work; the unfreeze shift restarts its 72 hours.
  const [owner] = await listRecords<{ frozenSince: string | null }>(client, 'agents', { id: { eq: contact.ownerId } }, { frozenSince: true }, 1);

  if (isDefined(owner?.frozenSince)) {
    await updateRecordsWhere(client, 'People', { id: { eq: contact.id } }, { planProgress: 'Frozen' });
  }

  return 'processed';
};
