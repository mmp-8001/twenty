import { ACTIVE_FOLLOWUP_STAGES } from 'src/constants/followup.constant';
import { MILLISECONDS_PER_DAY } from 'src/constants/proopco-jobs.constant';
import {
  createRecord,
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/list-records.util';

type TrackResult =
  | { success: true; followupId: string }
  | { success: false; error: string };

type TraderNode = { name?: { firstName?: string; lastName?: string } };
type FollowupTypeNode = {
  id: string;
  name: string;
  expiryDays: number;
  createdAt: string;
};

export const trackTrader = async ({
  client,
  traderId,
  ownerId,
  followupTypeId,
  now,
}: {
  client: RecordsClient;
  traderId: string;
  ownerId: string;
  followupTypeId?: string;
  now: Date;
}): Promise<TrackResult> => {
  const [trader] = await listRecords<TraderNode>(
    client,
    'people',
    { id: { eq: traderId } },
    { name: { firstName: true, lastName: true } },
  );

  if (!trader) {
    return { success: false, error: 'Trader not found' };
  }

  // ponytail: check-then-create, two simultaneous Tracks can both pass; add a unique key if that happens.
  const active = await listRecords(client, 'followups', {
    traderId: { eq: traderId },
    stage: { in: ACTIVE_FOLLOWUP_STAGES },
  }, {});

  if (active.length > 0) {
    return {
      success: false,
      error: 'This Trader already has an active Followup',
    };
  }

  // The command names no type, so the oldest one (the seeded default) applies.
  const [followupType] = (
    await listRecords<FollowupTypeNode>(
      client,
      'followupTypes',
      followupTypeId ? { id: { eq: followupTypeId } } : {},
      { name: true, expiryDays: true, createdAt: true },
    )
  ).sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  if (!followupType) {
    return { success: false, error: 'No Followup Type available' };
  }

  const traderName = [trader.name?.firstName, trader.name?.lastName]
    .filter(Boolean)
    .join(' ');
  const followupId = await createRecord(client, 'Followup', {
    name: `${traderName || 'Trader'} - ${followupType.name}`,
    stage: 'PENDING',
    traderId,
    ownerId,
    followupTypeId: followupType.id,
    expiresAt: new Date(
      now.getTime() + followupType.expiryDays * MILLISECONDS_PER_DAY,
    ).toISOString(),
  });

  return { success: true, followupId };
};
