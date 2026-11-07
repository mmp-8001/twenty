import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PROOPCO_SYNC_TOKEN_HEADER } from '../constants/proopco-sync.constant';
import {
  ADD_TO_FOLLOWUP_ROUTE_PATH,
  MY_FOLLOWUPS_ROUTE_PATH,
  RECORD_CALL_ROUTE_PATH,
} from '../constants/ownership.constant';
import { buildTouchWindows } from '../utils/call-windows.util';
import { metadataRequest } from './metadata-request';
import { postRoute } from './post-sync-route';
import { mutate, query, uniqueId } from './sales-core-helpers';
import {
  assignSeededRoles,
  SEEDED_AGENT_EMAIL,
  signIn,
} from './seeded-sessions';
import { TEST_SYNC_TOKEN } from './test-constants';

const DAY_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_DAYS = 5;

type RouteResult = { success: boolean; error?: string; callId?: string; rows?: { personId: string; purpose: { kind: string }; nextCallAt: string }[] };

describe('Deadlines, call windows and the My follow-ups queue', () => {
  const tag = uniqueId('ddl');
  const created: { singular: string; id: string }[] = [];
  let agentToken: string;
  let agentId: string;
  let restoreRoles: () => Promise<void>;
  let campaignId: string;
  let personObjectId: string;
  let satisfiedReasonId: string;

  const create = async (singular: string, data: Record<string, unknown>) => {
    const result = await mutate({ [`create${singular}`]: { __args: { data }, id: true } });
    const id = result[`create${singular}`].id as string;

    created.push({ singular, id });

    return id;
  };

  const update = (singular: string, id: string, data: Record<string, unknown>) =>
    mutate({ [`update${singular}`]: { __args: { id, data }, id: true } });

  const readAll = async (collection: string, filter: Record<string, unknown>, selection: object) => {
    const result = await query({
      [collection]: { __args: { filter, first: 50 }, edges: { node: { id: true, ...selection } } },
    });

    return (result[collection].edges as { node: Record<string, any> }[]).map(({ node }) => node);
  };

  const createPerson = (suffix: string) =>
    create('Person', {
      name: { firstName: 'Ddl', lastName: `${tag}-${suffix}` },
      kycStatus: tag,
      visibleToMemberIds: [agentId],
      candidateCampaignIds: [campaignId],
    });

  const callRoute = async (path: string, body: unknown) =>
    (await postRoute({ path, headers: { authorization: `Bearer ${agentToken}` }, body })).data as RouteResult;

  const addUser = async (suffix: string) => {
    const personId = await createPerson(suffix);

    expect(await callRoute(ADD_TO_FOLLOWUP_ROUTE_PATH, { personId })).toMatchObject({ success: true });

    const [followup] = await readAll('followups', { openKey: { eq: personId } }, { campaignId: true });
    const [ownership] = await readAll('ownerships', { openUserKey: { eq: personId } }, {});

    return { personId, followupId: followup.id as string, ownershipId: ownership.id as string, campaignId: followup.campaignId };
  };

  // Moves a freshly added case to "answered first call happened at firstAnsweredAt", with its five windows.
  const makeInProgress = async (
    { personId: _personId, followupId, ownershipId }: Awaited<ReturnType<typeof addUser>>,
    firstAnsweredAt: Date,
  ) => {
    await update('Followup', followupId, {
      status: 'IN_PROGRESS',
      firstAnsweredCallAt: firstAnsweredAt.toISOString(),
      deadlineAt: new Date(firstAnsweredAt.getTime() + 30 * DAY_MS).toISOString(),
    });
    await update('Ownership', ownershipId, { state: 'IN_FOLLOWUP' });

    for (const window of buildTouchWindows(firstAnsweredAt)) {
      await create('Touch', {
        followupId,
        adminId: agentId,
        touchNo: window.touchNo,
        windowStartAt: window.windowStartAt.toISOString(),
        windowEndAt: window.windowEndAt.toISOString(),
        status: window.touchNo === 1 ? 'DONE' : 'OPEN',
      });
    }
  };

  const touchesOf = async (followupId: string) =>
    (await readAll('touches', { followupId: { eq: followupId } }, { touchNo: true, status: true, completedCallId: true }))
      .sort((a, b) => a.touchNo - b.touchNo);

  const unansweredForm = (personId: string, nextCallAt: Date, data: Record<string, unknown> = {}) => ({
    personId,
    technicalStatus: 'NO_ANSWER',
    feedbackReasonIds: [],
    nextCallAt: nextCallAt.toISOString(),
    ...data,
  });

  const answeredForm = (personId: string, nextCallAt: Date, data: Record<string, unknown> = {}) => ({
    personId,
    technicalStatus: 'ANSWERED',
    feedbackReasonIds: [satisfiedReasonId],
    nextCallAt: nextCallAt.toISOString(),
    ...data,
  });

  const sweep = async (referenceDate?: Date) => {
    const { data } = await postRoute({
      path: '/proopco/sweep-followups',
      headers: { [PROOPCO_SYNC_TOKEN_HEADER]: TEST_SYNC_TOKEN },
      body: referenceDate ? { referenceDate: referenceDate.toISOString() } : {},
    });

    expect(data.success).toBe(true);

    return data as { closedFollowups: number; missedTouches: number };
  };

  const personState = async (personId: string) =>
    (await readAll('people', { id: { eq: personId } }, {
      currentOwnerId: true,
      cooldownUntil: true,
      visibleToMemberIds: true,
    }))[0];

  const recompute = async (referenceDate?: Date) => {
    await postRoute({
      path: '/proopco/recompute-visibility',
      headers: { [PROOPCO_SYNC_TOKEN_HEADER]: TEST_SYNC_TOKEN },
      body: referenceDate ? { referenceDate: referenceDate.toISOString() } : {},
    });
  };

  const createSegmentView = async () => {
    const { createView } = await metadataRequest<{ createView: { id: string } }>(
      `mutation ($input: CreateViewInput!) { createView(input: $input) { id } }`,
      { input: { name: uniqueId('segment'), objectMetadataId: personObjectId, icon: 'IconUsers' } },
    );
    let after: string | null = null;
    let kycFieldId: string | undefined;

    while (!kycFieldId) {
      const page: {
        fields: {
          edges: { node: { id: string; name: string; objectMetadataId: string } }[];
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
        };
      } = await metadataRequest(
        `query ($after: ConnectionCursor) {
          fields(paging: { first: 500, after: $after }) {
            edges { node { id name objectMetadataId } }
            pageInfo { hasNextPage endCursor }
          }
        }`,
        { after },
      );

      kycFieldId = page.fields.edges.find(
        ({ node }) => node.name === 'kycStatus' && node.objectMetadataId === personObjectId,
      )?.node.id;
      after = page.fields.pageInfo.endCursor;
    }

    await metadataRequest(
      `mutation ($input: CreateViewFilterInput!) { createViewFilter(input: $input) { id } }`,
      { input: { viewId: createView.id, fieldMetadataId: kycFieldId, operand: 'CONTAINS', value: tag } },
    );

    return createView.id;
  };

  beforeAll(async () => {
    const assigned = await assignSeededRoles([
      { email: SEEDED_AGENT_EMAIL, roleLabel: 'Sales Admin' },
    ]);

    restoreRoles = assigned.restore;
    agentId = assigned.memberIds[SEEDED_AGENT_EMAIL];
    agentToken = await signIn(SEEDED_AGENT_EMAIL);

    const { objects } = await metadataRequest<{
      objects: { edges: { node: { id: string; nameSingular: string } }[] };
    }>(`{ objects(paging: { first: 200 }) { edges { node { id nameSingular } } } }`);

    personObjectId = objects.edges.find(({ node }) => node.nameSingular === 'person')!.node.id;
    campaignId = await create('Campaign', {
      name: uniqueId('campaign'),
      segmentViewId: await createSegmentView(),
      startsAt: new Date(Date.now() - DAY_MS).toISOString(),
      status: 'ACTIVE',
      cooldownDays: COOLDOWN_DAYS,
    });
    await create('CampaignAdmin', { campaignId, adminId: agentId });

    [{ id: satisfiedReasonId }] = await readAll(
      'feedbackReasons',
      { sentiment: { eq: 'POSITIVE' }, isOther: { eq: false } },
      {},
    );
  });

  afterAll(async () => {
    await update('Campaign', campaignId, { status: 'ENDED' }).catch(() => undefined);
    await recompute();
    await restoreRoles?.();

    for (const { singular, id } of [...created].reverse()) {
      await mutate({ [`destroy${singular}`]: { __args: { id }, id: true } }).catch(() => undefined);
    }
  });

  describe('the every-minute sweep', () => {
    it('ends a case unanswered for 7 days with no cooldown and logs the calls as unanswered (TS1)', async () => {
      const added = await addUser('ts1');

      expect(added.campaignId).toBe(campaignId);

      const first = await callRoute(RECORD_CALL_ROUTE_PATH, unansweredForm(added.personId, new Date(Date.now() + DAY_MS)));
      const second = await callRoute(RECORD_CALL_ROUTE_PATH, unansweredForm(added.personId, new Date(Date.now() + 2 * DAY_MS)));

      expect(first.success && second.success).toBe(true);

      // Not due yet: a sweep just before the 7 days leaves the case alone.
      await sweep(new Date(Date.now() + 6 * DAY_MS));
      expect((await readAll('followups', { id: { eq: added.followupId } }, { status: true }))[0].status).toBe('PENDING_FIRST_CALL');

      const reference = new Date(Date.now() + 8 * DAY_MS);

      await sweep(reference);

      const [followup] = await readAll('followups', { id: { eq: added.followupId } }, { status: true, closedAt: true, openKey: true });
      const [ownership] = await readAll('ownerships', { id: { eq: added.ownershipId } }, { endReason: true, openUserKey: true });
      const person = await personState(added.personId);
      const calls = await readAll('calls', { personId: { eq: added.personId } }, { isAnswered: true });

      expect(followup).toMatchObject({ status: 'NO_ANSWER_FIRST_CALL', openKey: '' });
      expect(ownership).toMatchObject({ endReason: 'NO_ANSWER_7D', openUserKey: '' });
      expect(person.currentOwnerId).toBeNull();
      expect(person.cooldownUntil).toBeNull();
      expect(person.visibleToMemberIds).toContain(agentId);
      expect(calls).toHaveLength(2);
      expect(calls.every(({ isAnswered }) => isAnswered === false)).toBe(true);
    });

    it('expires an in-progress case at 30 days, hides the user for the campaign cooldown, then lists them again', async () => {
      const added = await addUser('expire');
      const firstAnswered = new Date(Date.now() - 1000);

      await makeInProgress(added, firstAnswered);

      // Two overlapping sweeps must close the case once.
      const reference = new Date(firstAnswered.getTime() + 31 * DAY_MS);
      const results = await Promise.all([sweep(reference), sweep(reference)]);

      expect(results.length).toBe(2);

      const [followup] = await readAll('followups', { id: { eq: added.followupId } }, { status: true, closedAt: true });
      const [ownership] = await readAll('ownerships', { id: { eq: added.ownershipId } }, { endReason: true });
      const person = await personState(added.personId);

      expect(followup.status).toBe('EXPIRED');
      expect(ownership.endReason).toBe('EXPIRED');
      expect(person.currentOwnerId).toBeNull();
      expect(new Date(person.cooldownUntil).getTime()).toBe(reference.getTime() + COOLDOWN_DAYS * DAY_MS);
      expect(person.visibleToMemberIds).not.toContain(agentId);

      await sweep(new Date(reference.getTime() + COOLDOWN_DAYS * DAY_MS + 60_000));

      expect((await personState(added.personId)).visibleToMemberIds).toContain(agentId);
      expect((await touchesOf(added.followupId)).filter(({ status }) => status === 'MISSED').length).toBeGreaterThanOrEqual(1);
    });

    it('marks open windows past their end as missed', async () => {
      const added = await addUser('missed');

      await makeInProgress(added, new Date(Date.now() - 5 * DAY_MS));
      await sweep();

      const touches = await touchesOf(added.followupId);

      expect(touches.map(({ status }) => status)).toEqual(['DONE', 'MISSED', 'OPEN', 'OPEN', 'OPEN']);
    });
  });

  describe('call windows in the end-of-call form', () => {
    it('creates five windows on the first answered call and completes the first (Q-01)', async () => {
      const added = await addUser('windows');
      const result = await callRoute(RECORD_CALL_ROUTE_PATH, answeredForm(added.personId, new Date(Date.now() + 2 * DAY_MS)));

      expect(result.success).toBe(true);

      const touches = await touchesOf(added.followupId);

      expect(touches.map(({ status }) => status)).toEqual(['DONE', 'OPEN', 'OPEN', 'OPEN', 'OPEN']);
      expect(touches[0].completedCallId).toBe(result.callId);
    });

    it('requires an off-schedule reason on the first call too and defers skipped windows on a user request (QS2)', async () => {
      const added = await addUser('qs2');
      const farAway = new Date(Date.now() + 10 * DAY_MS);

      expect((await callRoute(RECORD_CALL_ROUTE_PATH, answeredForm(added.personId, farAway))).success).toBe(false);

      const result = await callRoute(
        RECORD_CALL_ROUTE_PATH,
        answeredForm(added.personId, farAway, { offScheduleReason: 'USER_REQUEST' }),
      );

      expect(result.success).toBe(true);
      expect((await touchesOf(added.followupId)).map(({ status }) => status)).toEqual([
        'DONE',
        'DEFERRED_BY_USER',
        'DEFERRED_BY_USER',
        'OPEN',
        'OPEN',
      ]);
      expect((await readAll('calls', { id: { eq: result.callId } }, { offScheduleReason: true }))[0].offScheduleReason).toBe('USER_REQUEST');
    });

    it('counts an admin-decided jump as missed once the window ends (QS2)', async () => {
      const added = await addUser('qs2-admin');
      const result = await callRoute(
        RECORD_CALL_ROUTE_PATH,
        answeredForm(added.personId, new Date(Date.now() + 10 * DAY_MS), { offScheduleReason: 'ADMIN_DECISION' }),
      );

      expect(result.success).toBe(true);
      expect((await touchesOf(added.followupId)).slice(1, 3).map(({ status }) => status)).toEqual(['OPEN', 'OPEN']);

      await sweep(new Date(Date.now() + 9 * DAY_MS));

      expect((await touchesOf(added.followupId)).slice(1, 3).map(({ status }) => status)).toEqual(['MISSED', 'MISSED']);
    });

    it('leaves the window open after an unanswered call and completes the right one on an answer (QS1)', async () => {
      const added = await addUser('qs1');
      const firstAnswered = new Date(Date.now() - 5 * DAY_MS);

      await makeInProgress(added, firstAnswered);

      const tomorrow = new Date(Date.now() + DAY_MS);
      const unanswered = await callRoute(RECORD_CALL_ROUTE_PATH, unansweredForm(added.personId, tomorrow));

      expect(unanswered.success).toBe(true);
      expect((await touchesOf(added.followupId)).map(({ status }) => status)).toEqual(['DONE', 'OPEN', 'OPEN', 'OPEN', 'OPEN']);

      // Day 5 is window 3 (days 4-7): an answered call completes it.
      const answered = await callRoute(RECORD_CALL_ROUTE_PATH, answeredForm(added.personId, new Date(Date.now() + 4 * DAY_MS)));

      expect(answered.success).toBe(true);

      const touches = await touchesOf(added.followupId);

      expect(touches[2]).toMatchObject({ status: 'DONE', completedCallId: answered.callId });
    });

    it('caps the next call at the deadline (QS5)', async () => {
      const added = await addUser('qs5');

      await makeInProgress(added, new Date(Date.now() - 27 * DAY_MS));

      const result = await callRoute(
        RECORD_CALL_ROUTE_PATH,
        unansweredForm(added.personId, new Date(Date.now() + 7 * DAY_MS), { offScheduleReason: 'USER_REQUEST' }),
      );

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/deadline/i);
    });
  });

  describe('My follow-ups', () => {
    it('returns open cases and successful users with a call time, nearest first and only the callers (Q-05)', async () => {
      const overdue = await addUser('q-overdue');
      const later = await addUser('q-later');
      const retention = await addUser('q-retention');
      const retentionWithoutTime = await addUser('q-retention-none');
      const fresh = await addUser('q-fresh');
      const callAt = (personId: string, nextCallAt: Date | null) =>
        create('Call', {
          personId,
          adminId: agentId,
          kind: 'FOLLOWUP',
          startedAt: new Date().toISOString(),
          technicalStatus: 'NO_ANSWER',
          isAnswered: false,
          nextCallAt: nextCallAt?.toISOString() ?? null,
          source: 'MANUAL',
        });

      await callAt(overdue.personId, new Date(Date.now() - 3 * DAY_MS));
      await callAt(later.personId, new Date(Date.now() + 9 * DAY_MS));
      await callAt(retention.personId, new Date(Date.now() + 2 * DAY_MS));
      await callAt(retentionWithoutTime.personId, null);

      for (const successful of [retention, retentionWithoutTime]) {
        await update('Followup', successful.followupId, { status: 'SUCCESSFUL', openKey: null });
        await update('Ownership', successful.ownershipId, { state: 'SUCCESSFUL' });
      }

      const result = await callRoute(MY_FOLLOWUPS_ROUTE_PATH, {});
      const mine = result.rows!.filter(({ personId }) =>
        [overdue, later, retention, retentionWithoutTime, fresh].some((added) => added.personId === personId),
      );

      expect(result.success).toBe(true);
      expect(mine.map(({ personId }) => personId)).toEqual([
        overdue.personId,
        fresh.personId,
        retention.personId,
        later.personId,
      ]);
      expect(mine.find(({ personId }) => personId === retention.personId)?.purpose.kind).toBe('RETENTION');
      expect(mine.find(({ personId }) => personId === overdue.personId)?.purpose.kind).toBe('CAMPAIGN');
    });
  });
});
