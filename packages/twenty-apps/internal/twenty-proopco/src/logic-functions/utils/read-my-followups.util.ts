import { isString } from '@sniptt/guards';

import { listRecords, type RecordsClient } from 'src/logic-functions/utils/list-records.util';
import { findTouchNoAt, startOfTehranDay } from 'src/utils/call-windows.util';
import { DAY_MS } from 'src/constants/time.constant';

export type MyFollowupRow = {
  personId: string;
  name: string;
  nextCallAt: string;
  purpose: { kind: 'CAMPAIGN' | 'REBUY' | 'RETENTION'; campaignName: string | null };
  platformStage: string | null;
  purchaseCount: number;
  progress:
    | { type: 'SCHEDULE'; touchNo: number | null; day: number }
    | { type: 'COUNTDOWN'; deadlineAt: string | null };
  lastCall: { startedAt: string; technicalStatus: string; noteLine: string } | null;
};

type FollowupNode = {
  id: string;
  kind: string | null;
  status: string | null;
  personId: string | null;
  campaignId: string | null;
  addedAt: string | null;
  deadlineAt: string | null;
  firstAnsweredCallAt: string | null;
};

type CallNode = {
  personId: string | null;
  startedAt: string | null;
  technicalStatus: string | null;
  note: string | null;
  nextCallAt: string | null;
};

type TouchNode = { followupId: string | null; touchNo: number; windowStartAt: string; windowEndAt: string };

// The caller's open cases plus their successful Users with a call time, one row per User.
export const readMyFollowups = async ({
  client,
  memberId,
  now = new Date(),
}: {
  client: RecordsClient;
  memberId: string;
  now?: Date;
}): Promise<MyFollowupRow[]> => {
  const followups = await listRecords<FollowupNode>(
    client,
    'followups',
    { adminId: { eq: memberId }, status: { in: ['PENDING_FIRST_CALL', 'IN_PROGRESS'] } },
    { kind: true, status: true, personId: true, campaignId: true, addedAt: true, deadlineAt: true, firstAnsweredCallAt: true },
  );
  const followupPersonIds = new Set(followups.map(({ personId }) => personId));
  const retentionOwnerships = await listRecords<{ personId: string | null }>(
    client,
    'ownerships',
    { adminId: { eq: memberId }, state: { eq: 'SUCCESSFUL' }, endedAt: { is: 'NULL' } },
    { personId: true },
  );
  const retentionPersonIds = retentionOwnerships
    .map(({ personId }) => personId)
    .filter((personId): personId is string => isString(personId) && !followupPersonIds.has(personId));
  const personIds = [...followupPersonIds, ...retentionPersonIds].filter(isString);

  if (personIds.length === 0) {
    return [];
  }

  const [people, calls, touches, campaigns] = await Promise.all([
    listRecords<{
      id: string;
      name: { firstName: string | null; lastName: string | null } | null;
      currentStage: string | null;
      purchaseCount: number | null;
    }>(client, 'people', { id: { in: personIds } }, {
      name: { firstName: true, lastName: true },
      currentStage: true,
      purchaseCount: true,
    }),
    listRecords<CallNode>(client, 'calls', { adminId: { eq: memberId }, personId: { in: personIds } }, {
      personId: true,
      startedAt: true,
      technicalStatus: true,
      note: true,
      nextCallAt: true,
    }),
    listRecords<TouchNode>(client, 'touches', { followupId: { in: followups.map(({ id }) => id) } }, {
      followupId: true,
      touchNo: true,
      windowStartAt: true,
      windowEndAt: true,
    }),
    listRecords<{ id: string; name: string | null }>(client, 'campaigns', {}, { name: true }),
  ]);
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const campaignNames = new Map(campaigns.map(({ id, name }) => [id, name]));
  const latestCallByPersonId = new Map<string, CallNode>();

  for (const call of calls) {
    const current = latestCallByPersonId.get(call.personId ?? '');

    if (call.personId && (!current || (call.startedAt ?? '') > (current.startedAt ?? ''))) {
      latestCallByPersonId.set(call.personId, call);
    }
  }

  const describePerson = (personId: string) => {
    const person = peopleById.get(personId);

    return {
      name: [person?.name?.firstName, person?.name?.lastName].filter(isString).join(' ').trim(),
      platformStage: person?.currentStage ?? null,
      purchaseCount: person?.purchaseCount ?? 0,
    };
  };
  const describeLastCall = (personId: string): MyFollowupRow['lastCall'] => {
    const call = latestCallByPersonId.get(personId);

    return call?.startedAt
      ? {
          startedAt: call.startedAt,
          technicalStatus: call.technicalStatus ?? '',
          noteLine: (call.note ?? '').split('\n')[0],
        }
      : null;
  };
  const rows: MyFollowupRow[] = [];

  for (const followup of followups) {
    if (!followup.personId) {
      continue;
    }

    const lastCall = latestCallByPersonId.get(followup.personId);
    const nextCallAt = lastCall?.nextCallAt ?? followup.addedAt;

    if (!nextCallAt) {
      continue;
    }

    const windows = touches
      .filter(({ followupId }) => followupId === followup.id)
      .map(({ touchNo, windowStartAt, windowEndAt }) => ({
        touchNo,
        windowStartAt: new Date(windowStartAt),
        windowEndAt: new Date(windowEndAt),
      }));

    rows.push({
      personId: followup.personId,
      ...describePerson(followup.personId),
      nextCallAt,
      purpose: {
        kind: followup.kind === 'REBUY' ? 'REBUY' : 'CAMPAIGN',
        campaignName: campaignNames.get(followup.campaignId ?? '') ?? null,
      },
      progress:
        followup.status === 'IN_PROGRESS' && followup.firstAnsweredCallAt
          ? {
              type: 'SCHEDULE',
              touchNo: findTouchNoAt(windows, now),
              day: Math.round(
                (startOfTehranDay(now).getTime() -
                  startOfTehranDay(new Date(followup.firstAnsweredCallAt)).getTime()) /
                  DAY_MS,
              ),
            }
          : { type: 'COUNTDOWN', deadlineAt: followup.deadlineAt },
      lastCall: describeLastCall(followup.personId),
    });
  }

  for (const personId of retentionPersonIds) {
    const nextCallAt = latestCallByPersonId.get(personId)?.nextCallAt;

    if (nextCallAt) {
      rows.push({
        personId,
        ...describePerson(personId),
        nextCallAt,
        purpose: { kind: 'RETENTION', campaignName: null },
        progress: { type: 'COUNTDOWN', deadlineAt: null },
        lastCall: describeLastCall(personId),
      });
    }
  }

  return rows.sort((a, b) => new Date(a.nextCallAt).getTime() - new Date(b.nextCallAt).getTime());
};
