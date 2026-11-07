import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  ADD_TO_FOLLOWUP_ROUTE_PATH,
  EDIT_CALL_NOTE_ROUTE_PATH,
  OWN_07_MESSAGE,
  RECORD_CALL_ROUTE_PATH,
  USER_NOT_AVAILABLE_MESSAGE,
} from '../constants/ownership.constant';
import { postRoute } from './post-sync-route';
import { mutate, query, uniqueId, waitFor } from './sales-core-helpers';
import {
  assignSeededRoles,
  SEEDED_ADMIN_EMAIL,
  SEEDED_AGENT_EMAIL,
  SEEDED_MANAGER_EMAIL,
  SEEDED_OTHER_AGENT_EMAIL,
  signIn,
  userRequest,
} from './seeded-sessions';

const DAY_MS = 24 * 60 * 60 * 1000;

type RouteResult = { success: boolean; error?: string; callId?: string };

describe('Ownership, calls and the end-of-call form', () => {
  const tag = uniqueId('own');
  const created: { singular: string; id: string }[] = [];
  let agentToken: string;
  let otherAgentToken: string;
  let supervisorToken: string;
  let adminToken: string;
  let agentId: string;
  let otherAgentId: string;
  let restoreRoles: () => Promise<void>;
  let satisfiedReasonId: string;
  let failureReasonId: string;

  const createPerson = async (suffix: string, data: Record<string, unknown> = {}) => {
    const result = await mutate({
      createPerson: {
        __args: {
          data: { name: { firstName: 'Own', lastName: `${tag}-${suffix}` }, kycStatus: tag, ...data },
        },
        id: true,
      },
    });
    const id = result.createPerson.id as string;

    created.push({ singular: 'Person', id });

    return id;
  };

  const callRoute = async (token: string, path: string, body: unknown) =>
    (await postRoute({ path, headers: { authorization: `Bearer ${token}` }, body }))
      .data as RouteResult;

  const add = (token: string, personId: string) =>
    callRoute(token, ADD_TO_FOLLOWUP_ROUTE_PATH, { personId });

  const readOne = async (collection: string, filter: Record<string, unknown>, selection: object) => {
    const result = await query({
      [collection]: {
        __args: { filter, first: 50 },
        edges: { node: { id: true, ...selection } },
      },
    });

    return (result[collection].edges as { node: Record<string, any> }[]).map(({ node }) => node);
  };

  const person = async (id: string) =>
    (
      await readOne('people', { id: { eq: id } }, {
        currentOwnerId: true,
        permanentlyFailedAt: true,
        visibleToMemberIds: true,
      })
    )[0];

  const answeredForm = (personId: string, data: Record<string, unknown> = {}) => ({
    personId,
    technicalStatus: 'ANSWERED',
    feedbackReasonIds: [satisfiedReasonId],
    nextCallAt: new Date(Date.now() + 2 * DAY_MS).toISOString(),
    ...data,
  });

  const readerSees = async (token: string, personId: string) => {
    const { data, errors } = await userRequest<{ people: { edges: { node: { id: string } }[] } }>({
      token,
      query: `query ($id: UUID!) { people(filter: { id: { eq: $id } }) { edges { node { id } } } }`,
      variables: { id: personId },
    });

    expect(errors).toBeUndefined();

    return data!.people.edges.length > 0;
  };

  beforeAll(async () => {
    const assigned = await assignSeededRoles([
      { email: SEEDED_AGENT_EMAIL, roleLabel: 'Sales Admin' },
      { email: SEEDED_OTHER_AGENT_EMAIL, roleLabel: 'Sales Admin' },
      { email: SEEDED_MANAGER_EMAIL, roleLabel: 'Supervisor' },
    ]);

    restoreRoles = assigned.restore;
    agentId = assigned.memberIds[SEEDED_AGENT_EMAIL];
    otherAgentId = assigned.memberIds[SEEDED_OTHER_AGENT_EMAIL];
    [agentToken, otherAgentToken, supervisorToken, adminToken] = await Promise.all([
      signIn(SEEDED_AGENT_EMAIL),
      signIn(SEEDED_OTHER_AGENT_EMAIL),
      signIn(SEEDED_MANAGER_EMAIL),
      signIn(SEEDED_ADMIN_EMAIL),
    ]);

    const [satisfied] = await readOne(
      'feedbackReasons',
      { sentiment: { eq: 'POSITIVE' }, isOther: { eq: false } },
      { title: true },
    );
    const [failure] = await readOne('failureReasons', {}, { title: true });

    satisfiedReasonId = satisfied.id;
    failureReasonId = failure.id;
  });

  afterAll(async () => {
    await restoreRoles?.();

    for (const { singular, id } of [...created].reverse()) {
      await mutate({ [`destroy${singular}`]: { __args: { id }, id: true } }).catch(() => undefined);
    }
  });

  it('seeds the failure and feedback reasons once', async () => {
    expect(await readOne('failureReasons', {}, { title: true })).toHaveLength(3);
    expect((await readOne('feedbackReasons', {}, { title: true })).length).toBeGreaterThanOrEqual(7);
  });

  describe('Add to follow-up', () => {
    it('makes the caller the owner with a pending case and a 7-day deadline (S1)', async () => {
      const personId = await createPerson('add', { visibleToMemberIds: [agentId, otherAgentId] });
      const before = Date.now();
      const result = await add(agentToken, personId);

      expect(result).toMatchObject({ success: true });

      const [ownership] = await readOne('ownerships', { openUserKey: { eq: personId } }, {
        state: true,
        adminId: true,
        endedAt: true,
        personId: true,
      });
      const [followup] = await readOne('followups', { openKey: { eq: personId } }, {
        status: true,
        kind: true,
        adminId: true,
        ownershipId: true,
        deadlineAt: true,
      });

      expect(ownership).toMatchObject({ state: 'PENDING_FIRST_CALL', adminId: agentId, personId });
      expect(followup).toMatchObject({
        status: 'PENDING_FIRST_CALL',
        kind: 'CAMPAIGN',
        adminId: agentId,
        ownershipId: ownership.id,
      });
      expect(new Date(followup.deadlineAt).getTime() - before).toBeGreaterThan(6.9 * DAY_MS);
      expect(new Date(followup.deadlineAt).getTime() - before).toBeLessThan(7.1 * DAY_MS);
      expect((await person(personId)).currentOwnerId).toBe(agentId);
      expect(await readerSees(otherAgentToken, personId)).toBe(false);
    });

    it('tells a later attempt only the OWN-07 message (S3)', async () => {
      const personId = await createPerson('later', { visibleToMemberIds: [agentId, otherAgentId] });

      await add(agentToken, personId);

      expect(await add(otherAgentToken, personId)).toEqual({ success: false, error: OWN_07_MESSAGE });
      expect(await add(agentToken, personId)).toEqual({ success: false, error: OWN_07_MESSAGE });
    });

    it('lets exactly one of two concurrent clicks win and never opens two cases (S4)', async () => {
      const personId = await createPerson('race', { visibleToMemberIds: [agentId, otherAgentId] });
      const results = await Promise.all([add(agentToken, personId), add(otherAgentToken, personId)]);
      const winners = results.filter(({ success }) => success);
      const losers = results.filter(({ success }) => !success);

      expect(winners).toHaveLength(1);
      expect(losers).toEqual([{ success: false, error: OWN_07_MESSAGE }]);
      expect(await readOne('ownerships', { openUserKey: { eq: personId } }, {})).toHaveLength(1);
      expect(await readOne('followups', { openKey: { eq: personId } }, {})).toHaveLength(1);
    });

    it('refuses a user outside the caller list, in cooldown or permanently failed', async () => {
      const hidden = await createPerson('hidden');
      const cooling = await createPerson('cooling', {
        visibleToMemberIds: [agentId],
        cooldownUntil: new Date(Date.now() + DAY_MS).toISOString(),
      });
      const failed = await createPerson('FAILED', {
        visibleToMemberIds: [agentId],
        permanentlyFailedAt: new Date().toISOString(),
      });

      for (const personId of [hidden, cooling, failed]) {
        expect(await add(agentToken, personId)).toEqual({
          success: false,
          error: USER_NOT_AVAILABLE_MESSAGE,
        });
      }
    });
  });

  describe('Calls and the end-of-call form', () => {
    let personId: string;
    let followupId: string;

    beforeAll(async () => {
      personId = await createPerson('call', { visibleToMemberIds: [agentId, otherAgentId] });
      await add(agentToken, personId);
      followupId = (await readOne('followups', { openKey: { eq: personId } }, {}))[0].id;
    });

    it('refuses a call from anyone but the owner (CALL-01)', async () => {
      const result = await callRoute(otherAgentToken, RECORD_CALL_ROUTE_PATH, answeredForm(personId));

      expect(result.success).toBe(false);
    });

    it('validates the form', async () => {
      const send = (data: Record<string, unknown>) =>
        callRoute(agentToken, RECORD_CALL_ROUTE_PATH, answeredForm(personId, data));

      expect((await send({ feedbackReasonIds: [] })).success).toBe(false);
      expect((await send({ nextCallAt: null })).success).toBe(false);
      // Before the first answer the deadline is 7 days; an answered first call moves it to 30.
      expect(
        (
          await send({
            technicalStatus: 'NO_ANSWER',
            feedbackReasonIds: [],
            nextCallAt: new Date(Date.now() + 8 * DAY_MS).toISOString(),
          })
        ).error,
      ).toMatch(/deadline/i);
      expect(
        (await send({ nextCallAt: new Date(Date.now() + 31 * DAY_MS).toISOString() })).error,
      ).toMatch(/deadline/i);
      expect((await readOne('calls', { personId: { eq: personId } }, {})).length).toBe(0);
    });

    it('keeps the case pending after an unanswered call (TS3)', async () => {
      const result = await callRoute(agentToken, RECORD_CALL_ROUTE_PATH, {
        personId,
        technicalStatus: 'NO_ANSWER',
        nextCallAt: new Date(Date.now() + DAY_MS).toISOString(),
        note: 'no pickup',
      });

      expect(result.success).toBe(true);

      const [call] = await readOne('calls', { id: { eq: result.callId } }, {
        isAnswered: true,
        kind: true,
        technicalStatus: true,
        followupId: true,
        adminId: true,
      });
      const [followup] = await readOne('followups', { id: { eq: followupId } }, { status: true });

      expect(call).toMatchObject({
        isAnswered: false,
        kind: 'FOLLOWUP',
        technicalStatus: 'NO_ANSWER',
        followupId,
        adminId: agentId,
      });
      expect(followup.status).toBe('PENDING_FIRST_CALL');
    });

    it('starts the 30 days from the first answered call (TS4)', async () => {
      const before = Date.now();
      const result = await callRoute(agentToken, RECORD_CALL_ROUTE_PATH, answeredForm(personId));

      expect(result.success).toBe(true);

      const [followup] = await readOne('followups', { id: { eq: followupId } }, {
        status: true,
        firstAnsweredCallAt: true,
        deadlineAt: true,
      });
      const [ownership] = await readOne('ownerships', { openUserKey: { eq: personId } }, { state: true });
      const links = await readOne('callFeedbackReasons', { callId: { eq: result.callId } }, {
        feedbackReasonId: true,
      });

      expect(followup.status).toBe('IN_PROGRESS');
      expect(ownership.state).toBe('IN_FOLLOWUP');
      expect(links.map(({ feedbackReasonId }) => feedbackReasonId)).toEqual([satisfiedReasonId]);
      expect(new Date(followup.deadlineAt).getTime() - before).toBeGreaterThan(29.9 * DAY_MS);
      expect(new Date(followup.deadlineAt).getTime() - before).toBeLessThan(30.1 * DAY_MS);
      expect(new Date(followup.firstAnsweredCallAt).getTime()).toBeGreaterThanOrEqual(before - 1000);
    });

    it('does not move the deadline on a second answered call', async () => {
      const [{ deadlineAt }] = await readOne('followups', { id: { eq: followupId } }, { deadlineAt: true });

      await callRoute(agentToken, RECORD_CALL_ROUTE_PATH, answeredForm(personId));

      const [after] = await readOne('followups', { id: { eq: followupId } }, { deadlineAt: true });

      expect(after.deadlineAt).toBe(deadlineAt);
    });

    it('shows each call on the User timeline (TS8)', async () => {
      const activities = await waitFor(async () => {
        const found = await readOne('timelineActivities', { targetPersonId: { eq: personId } }, {
          name: true,
        });

        return found.length >= 3 ? found : undefined;
      });

      expect(activities.length).toBeGreaterThanOrEqual(3);
    });

    describe('locks', () => {
      let callId: string;

      beforeAll(async () => {
        callId = (await readOne('calls', { personId: { eq: personId } }, {}))[0].id;
      });

      it.each([
        ['Sales Admin', () => agentToken],
        ['Supervisor', () => supervisorToken],
        ['built-in admin', () => adminToken],
      ])('refuses a status update and a delete from a %s (TS6, TS7)', async (_label, token) => {
        const update = await userRequest({
          token: token(),
          query: `mutation ($id: UUID!) { updateCall(id: $id, data: { technicalStatus: "answered", isAnswered: true }) { id } }`,
          variables: { id: callId },
        });
        const remove = await userRequest({
          token: token(),
          query: `mutation ($id: UUID!) { destroyCall(id: $id) { id } }`,
          variables: { id: callId },
        });
        const softRemove = await userRequest({
          token: token(),
          query: `mutation ($id: UUID!) { deleteCall(id: $id) { id } }`,
          variables: { id: callId },
        });

        expect(update.errors?.length).toBeGreaterThan(0);
        expect(remove.errors?.length).toBeGreaterThan(0);
        expect(softRemove.errors?.length).toBeGreaterThan(0);
      });

      it('lets only the author edit the note and records when', async () => {
        const refused = await callRoute(otherAgentToken, EDIT_CALL_NOTE_ROUTE_PATH, {
          callId,
          note: 'not mine',
        });
        const accepted = await callRoute(agentToken, EDIT_CALL_NOTE_ROUTE_PATH, {
          callId,
          note: 'edited',
        });
        const [call] = await readOne('calls', { id: { eq: callId } }, {
          note: true,
          noteEditedAt: true,
        });

        expect(refused.success).toBe(false);
        expect(accepted.success).toBe(true);
        expect(call.note).toBe('edited');
        expect(call.noteEditedAt).toBeTruthy();
      });
    });
  });

  describe('Move to failed', () => {
    it('fails the user for good and never lists them again (S7)', async () => {
      const personId = await createPerson('fail', { visibleToMemberIds: [agentId, otherAgentId] });

      await add(agentToken, personId);

      const missingReason = await callRoute(agentToken, RECORD_CALL_ROUTE_PATH, {
        personId,
        technicalStatus: 'BUSY',
        failureReasonId: '00000000-0000-4000-8000-000000000000',
      });

      expect(missingReason.success).toBe(false);

      const result = await callRoute(agentToken, RECORD_CALL_ROUTE_PATH, {
        personId,
        technicalStatus: 'BUSY',
        failureReasonId,
      });

      expect(result.success).toBe(true);

      const [followup] = await readOne('followups', { personId: { eq: personId } }, {
        status: true,
        failureReasonId: true,
        closedAt: true,
        openKey: true,
      });
      const [ownership] = await readOne('ownerships', { personId: { eq: personId } }, {
        endReason: true,
        endedAt: true,
        openUserKey: true,
      });
      const failedPerson = await person(personId);

      expect(followup).toMatchObject({ status: 'FAILED', failureReasonId });
      expect(followup.openKey).toBeFalsy();
      expect(followup.closedAt).toBeTruthy();
      expect(ownership.endReason).toBe('FAILED');
      expect(ownership.openUserKey).toBeFalsy();
      expect(failedPerson.currentOwnerId).toBeNull();
      expect(failedPerson.permanentlyFailedAt).toBeTruthy();
      expect(await readerSees(agentToken, personId)).toBe(false);
      expect(await readerSees(otherAgentToken, personId)).toBe(false);
      expect(await add(otherAgentToken, personId)).toEqual({
        success: false,
        error: USER_NOT_AVAILABLE_MESSAGE,
      });
    });
  });

  describe('Reason lists', () => {
    it('lets the Full Admin manage them but not a Sales Admin', async () => {
      const create = (token: string) =>
        userRequest({
          token,
          query: `mutation ($data: FailureReasonCreateInput!) { createFailureReason(data: $data) { id } }`,
          variables: { data: { title: uniqueId('reason'), isActive: false } },
        });
      const asAgent = await create(agentToken);
      const asAdmin = await create(adminToken);

      expect(asAgent.errors?.length).toBeGreaterThan(0);
      expect(asAdmin.errors).toBeUndefined();
    });
  });
});
