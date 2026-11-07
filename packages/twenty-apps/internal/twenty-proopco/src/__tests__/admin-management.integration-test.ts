import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  ADMINS_ROUTE_PATH,
  DEACTIVATE_ADMIN_ROUTE_PATH,
  FLAG_LONG_FREEZES_ROUTE_PATH,
  FREEZE_ADMIN_ROUTE_PATH,
  NOT_ALLOWED_MESSAGE,
  RELEASE_USERS_ROUTE_PATH,
  TRANSFER_USERS_ROUTE_PATH,
  UNFREEZE_ADMIN_ROUTE_PATH,
} from '../constants/admin-management.constant';
import { PROOPCO_SYNC_TOKEN_HEADER } from '../constants/proopco-sync.constant';
import {
  ADD_TO_FOLLOWUP_ROUTE_PATH,
  RECORD_CALL_ROUTE_PATH,
} from '../constants/ownership.constant';
import { postRoute, postSyncRoute } from './post-sync-route';
import { mutate, query, tokenHeaders, uniqueId } from './sales-core-helpers';
import {
  assignSeededRoles,
  SEEDED_AGENT_EMAIL,
  SEEDED_MANAGER_EMAIL,
  SEEDED_OTHER_AGENT_EMAIL,
  signIn,
  userRequest,
} from './seeded-sessions';
import { TEST_SYNC_TOKEN } from './test-constants';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const SECOND_SALES_ADMIN_EMAIL = 'scott.forstall@apple.dev';

type RouteResult = {
  success: boolean;
  error?: string;
  results?: { personId: string; status: string }[];
  admins?: { memberId: string; status: string }[];
};
type Row = Record<string, any>;

describe('Freeze, transfer, deactivation and audit log', () => {
  const tag = uniqueId('adm');
  const created: { singular: string; id: string }[] = [];
  const tokens: Record<string, string> = {};
  const ids: Record<string, string> = {};
  let restoreRoles: () => Promise<void>;
  let restoreSecondRole: (() => Promise<void>) | undefined;
  let satisfiedReasonId: string;

  const create = async (singular: string, data: Record<string, unknown>) => {
    const result = await mutate({ [`create${singular}`]: { __args: { data }, id: true } });
    const id = result[`create${singular}`].id as string;

    created.push({ singular, id });

    return id;
  };

  const update = (singular: string, id: string, data: Record<string, unknown>) =>
    mutate({ [`update${singular}`]: { __args: { id, data }, id: true } });

  const readAll = async (collection: string, filter: Record<string, unknown>, selection: object): Promise<Row[]> => {
    const result = await query({
      [collection]: { __args: { filter, first: 50 }, edges: { node: { id: true, ...selection } } },
    });

    return (result[collection].edges as { node: Row }[]).map(({ node }) => node);
  };

  const route = async (who: string, path: string, body: unknown) =>
    (await postRoute({ path, headers: { authorization: `Bearer ${tokens[who]}` }, body })).data as RouteResult;

  const sync = async (items: unknown[]) => {
    const { data } = await postSyncRoute({ headers: tokenHeaders, body: { items } });

    expect(data.success).toBe(true);
    expect(data.results.every(({ status }: { status: string }) => status !== 'error')).toBe(true);
  };

  const sweep = async (referenceDate: Date) => {
    const { data } = await postRoute({
      path: '/proopco/sweep-followups',
      headers: { [PROOPCO_SYNC_TOKEN_HEADER]: TEST_SYNC_TOKEN },
      body: { referenceDate: referenceDate.toISOString() },
    });

    expect(data.success).toBe(true);
  };

  const freeze = (who: string, target: string, reason: string | null = 'Leave') =>
    route(who, FREEZE_ADMIN_ROUTE_PATH, { adminId: ids[target], reason });
  const unfreeze = (who: string, target: string) => route(who, UNFREEZE_ADMIN_ROUTE_PATH, { adminId: ids[target] });

  const statusOf = async (member: string) =>
    (await readAll('workspaceMembers', { id: { eq: ids[member] } }, { crmStatus: true, frozenSince: true }))[0];
  const auditOf = (subjectId: string, action: string) =>
    readAll('auditLogs', { subjectId: { eq: subjectId }, action: { eq: action } }, { actorId: true, reason: true, payload: true });

  type TestUser = { personId: string; proopcoId: string; followupId: string; ownershipId: string };

  // A user owned by the given admin, added through the real route and then moved to the requested state.
  const ownedUser = async (
    owner: string,
    suffix: string,
    state: 'PENDING_FIRST_CALL' | 'IN_FOLLOWUP' | 'SUCCESSFUL' | 'REBUY_PENDING',
  ): Promise<TestUser> => {
    const proopcoId = `${tag}-${suffix}`;
    const personId = await create('Person', {
      name: { firstName: 'Adm', lastName: proopcoId },
      proopcoId,
      visibleToMemberIds: [ids[owner]],
    });

    expect(await route(owner, ADD_TO_FOLLOWUP_ROUTE_PATH, { personId })).toMatchObject({ success: true });

    const [followup] = await readAll('followups', { openKey: { eq: personId } }, {});
    const [ownership] = await readAll('ownerships', { openUserKey: { eq: personId } }, {});

    if (state === 'IN_FOLLOWUP') {
      const answered = await route(owner, RECORD_CALL_ROUTE_PATH, {
        personId,
        technicalStatus: 'ANSWERED',
        feedbackReasonIds: [satisfiedReasonId],
        note: `call ${proopcoId}`,
        nextCallAt: new Date(Date.now() + DAY_MS).toISOString(),
        offScheduleReason: 'ADMIN_DECISION',
      });

      expect(answered.success).toBe(true);
    }

    if (state === 'SUCCESSFUL') {
      await update('Followup', followup.id, { status: 'SUCCESSFUL', openKey: null });
      await update('Ownership', ownership.id, { state: 'SUCCESSFUL' });
    }

    if (state === 'REBUY_PENDING') {
      await update('Followup', followup.id, {
        kind: 'REBUY',
        status: 'REBUY_PENDING',
        deadlineAt: new Date(Date.now() + 50 * HOUR_MS).toISOString(),
      });
      await update('Ownership', ownership.id, { state: 'REBUY_PENDING' });
    }

    return { personId, proopcoId, followupId: followup.id, ownershipId: ownership.id };
  };

  const followupOf = async (id: string) =>
    (await readAll('followups', { id: { eq: id } }, {
      status: true,
      openKey: true,
      deadlineAt: true,
      frozenRemainingSeconds: true,
      closedAt: true,
      adminId: true,
    }))[0];
  const ownershipOf = async (id: string) =>
    (await readAll('ownerships', { id: { eq: id } }, { state: true, endReason: true, openUserKey: true, adminId: true }))[0];
  const personOf = async (id: string) => (await readAll('people', { id: { eq: id } }, { currentOwnerId: true }))[0];
  const touchesOf = (followupId: string) =>
    readAll('touches', { followupId: { eq: followupId } }, { touchNo: true, windowEndAt: true, status: true, adminId: true });

  beforeAll(async () => {
    const assigned = await assignSeededRoles([
      { email: SEEDED_AGENT_EMAIL, roleLabel: 'Sales Admin' },
      { email: SECOND_SALES_ADMIN_EMAIL, roleLabel: 'Supervisor' },
      { email: SEEDED_OTHER_AGENT_EMAIL, roleLabel: 'Supervisor' },
      { email: SEEDED_MANAGER_EMAIL, roleLabel: 'Full Admin' },
    ]);
    // The seeded admin assigns roles and cannot change their own, so they keep their built-in role.
    const emails = {
      agent: SEEDED_AGENT_EMAIL,
      supervisor2: SECOND_SALES_ADMIN_EMAIL,
      supervisor: SEEDED_OTHER_AGENT_EMAIL,
      full: SEEDED_MANAGER_EMAIL,
    };

    restoreRoles = assigned.restore;

    for (const [name, email] of Object.entries(emails)) {
      ids[name] = assigned.memberIds[email];
      tokens[name] = await signIn(email);
    }

    ids.other = ids.supervisor2;
    tokens.other = tokens.supervisor2;
    [{ id: satisfiedReasonId }] = await readAll('feedbackReasons', { sentiment: { eq: 'POSITIVE' }, isOther: { eq: false } }, {});
  });

  afterAll(async () => {
    await restoreSecondRole?.();
    await restoreRoles?.();

    for (const member of ['agent', 'other', 'supervisor2']) {
      await update('WorkspaceMember', ids[member], { crmStatus: 'ACTIVE', frozenSince: null }).catch(() => undefined);
    }

    for (const { singular, id } of [...created].reverse()) {
      await mutate({ [`destroy${singular}`]: { __args: { id }, id: true } }).catch(() => undefined);
    }
  });

  it('applies the freeze permission rules on the server (S11, FRZ-01, ROLE-02)', async () => {
    expect((await freeze('agent', 'agent')).error).toBe(NOT_ALLOWED_MESSAGE);
    expect((await freeze('supervisor', 'supervisor')).error).toBe(NOT_ALLOWED_MESSAGE);
    expect((await freeze('full', 'full')).error).toBe(NOT_ALLOWED_MESSAGE);
    expect((await freeze('supervisor', 'supervisor2')).error).toBe(NOT_ALLOWED_MESSAGE);
    expect((await freeze('supervisor', 'full')).error).toBe(NOT_ALLOWED_MESSAGE);
    expect((await freeze('supervisor', 'agent', '  ')).error).toBe('A reason is required');
    expect((await statusOf('agent')).crmStatus).toBe('ACTIVE');

    expect(await freeze('supervisor', 'agent', 'Sick leave')).toEqual({ success: true });
    expect(await statusOf('agent')).toMatchObject({ crmStatus: 'FROZEN' });
    expect((await statusOf('agent')).frozenSince).toBeTruthy();
    expect(await freeze('supervisor', 'agent')).toMatchObject({ success: false, error: 'This admin is not active' });
    expect(await auditOf(ids.agent, 'FREEZE')).toMatchObject([{ actorId: ids.supervisor, reason: 'Sick leave' }]);

    expect(await freeze('full', 'supervisor2', 'Audit')).toEqual({ success: true });
    expect(await unfreeze('supervisor', 'supervisor2')).toMatchObject({ success: false, error: NOT_ALLOWED_MESSAGE });
    expect(await unfreeze('full', 'supervisor2')).toEqual({ success: true });
    expect(await unfreeze('supervisor', 'agent')).toEqual({ success: true });
    expect(await statusOf('agent')).toMatchObject({ crmStatus: 'ACTIVE' });
    expect(await auditOf(ids.agent, 'UNFREEZE')).toHaveLength(1);
  });

  it('stores remaining time on freeze, restores it and shifts open windows on unfreeze (S12), and still counts purchases (S8)', async () => {
    const user = await ownedUser('agent', 'frz', 'IN_FOLLOWUP');
    const before = await followupOf(user.followupId);
    const touchesBefore = await touchesOf(user.followupId);
    const frozenAt = Date.now();

    expect(before.deadlineAt).toBeTruthy();
    expect(touchesBefore).toHaveLength(5);

    expect(await freeze('supervisor', 'agent', 'Holiday')).toEqual({ success: true });

    const frozen = await followupOf(user.followupId);
    const expectedSeconds = (new Date(before.deadlineAt).getTime() - frozenAt) / 1000;

    expect(frozen.deadlineAt).toBeNull();
    expect(Math.abs(frozen.frozenRemainingSeconds - expectedSeconds)).toBeLessThan(120);

    // Nothing closes or misses while frozen, even far in the future.
    await sweep(new Date(Date.now() + 40 * DAY_MS));

    expect((await followupOf(user.followupId)).status).toBe('IN_PROGRESS');
    expect((await touchesOf(user.followupId)).filter(({ status }) => status === 'OPEN').length).toBe(
      touchesBefore.filter(({ status }) => status === 'OPEN').length,
    );

    // S8: a purchase during the freeze still pays the commission.
    await sync([
      { type: 'account', proopcoId: `${user.proopcoId}-a1`, data: { userProopcoId: user.proopcoId, status: 'active' } },
      {
        type: 'payment',
        proopcoId: `${user.proopcoId}-pay`,
        data: {
          userProopcoId: user.proopcoId,
          accountProopcoId: `${user.proopcoId}-a1`,
          amountToman: 6000000,
          amountUsdt: 100,
          paidAt: new Date().toISOString(),
        },
      },
    ]);
    expect(await readAll('commissions', { personId: { eq: user.personId } }, {})).toHaveLength(1);
  });

  it('keeps a rebuy case created during a freeze at its full 72h until unfreeze (FRZ-03)', async () => {
    const user = await ownedUser('agent', 'rebuy', 'SUCCESSFUL');

    await sync([{ type: 'account', proopcoId: `${user.proopcoId}-a1`, data: { userProopcoId: user.proopcoId, status: 'active' } }]);
    await sync([{ type: 'account', proopcoId: `${user.proopcoId}-a1`, data: { userProopcoId: user.proopcoId, status: 'breached' } }]);

    const [rebuy] = await readAll('followups', { personId: { eq: user.personId }, kind: { eq: 'REBUY' } }, {});

    expect(rebuy).toBeTruthy();

    const rebuyCase = await followupOf(rebuy.id);

    expect(rebuyCase.deadlineAt).toBeNull();
    expect(rebuyCase.frozenRemainingSeconds).toBe(72 * 3600);

    const frozenAt = new Date((await statusOf('agent')).frozenSince).getTime();

    expect(await unfreeze('supervisor', 'agent')).toEqual({ success: true });

    const restored = await followupOf(rebuy.id);

    expect(restored.frozenRemainingSeconds).toBeNull();
    expect(Math.abs(new Date(restored.deadlineAt).getTime() - (Date.now() + 72 * HOUR_MS))).toBeLessThan(5 * 60_000);
    expect(frozenAt).toBeLessThan(Date.now());
  });

  it('restores the deadline and shifts the open windows on unfreeze (S12)', async () => {
    const user = await ownedUser('agent', 'shift', 'IN_FOLLOWUP');
    const touchesBefore = await touchesOf(user.followupId);
    const before = await followupOf(user.followupId);

    expect(await freeze('supervisor', 'agent', 'Trip')).toEqual({ success: true });
    await new Promise((resolve) => setTimeout(resolve, 3000));
    expect(await unfreeze('supervisor', 'agent')).toEqual({ success: true });

    const after = await followupOf(user.followupId);
    const touchesAfter = await touchesOf(user.followupId);
    const openBefore = touchesBefore.find(({ status }) => status === 'OPEN');
    const openAfter = touchesAfter.find(({ id }: Row) => id === openBefore?.id);

    expect(after.frozenRemainingSeconds).toBeNull();
    expect(new Date(after.deadlineAt).getTime()).toBeGreaterThan(new Date(before.deadlineAt).getTime());
    expect(new Date(openAfter?.windowEndAt).getTime()).toBeGreaterThan(new Date(openBefore?.windowEndAt).getTime());
    expect((await statusOf('agent')).crmStatus).toBe('ACTIVE');
  });

  it('transfers users with remaining time, linked cases and visible calls (S13, TRF-01, TRF-02)', async () => {
    const secondRole = await assignSeededRoles([{ email: SECOND_SALES_ADMIN_EMAIL, roleLabel: 'Sales Admin' }]);

    restoreSecondRole = secondRole.restore;

    const inFollowup = await ownedUser('agent', 'trf1', 'IN_FOLLOWUP');
    const successful = await ownedUser('agent', 'trf2', 'SUCCESSFUL');
    const rebuy = await ownedUser('agent', 'trf3', 'REBUY_PENDING');
    const oldFollowup = await followupOf(inFollowup.followupId);
    const oldTouches = await touchesOf(inFollowup.followupId);
    const personIds = [inFollowup, successful, rebuy].map(({ personId }) => personId);

    expect(
      (await route('agent', TRANSFER_USERS_ROUTE_PATH, { personIds, toAdminId: ids.other, reason: 'x' })).error,
    ).toBe(NOT_ALLOWED_MESSAGE);
    expect(
      (await route('supervisor', TRANSFER_USERS_ROUTE_PATH, { personIds, toAdminId: ids.other, reason: '' })).error,
    ).toBe('A reason is required');
    expect(
      (await route('supervisor', TRANSFER_USERS_ROUTE_PATH, { personIds, toAdminId: ids.full, reason: 'x' })).success,
    ).toBe(false);

    const result = await route('supervisor', TRANSFER_USERS_ROUTE_PATH, {
      personIds,
      toAdminId: ids.other,
      reason: 'Workload',
    });

    expect(result.results?.map(({ status }) => status)).toEqual(['DONE', 'DONE', 'DONE']);

    // Old records close and keep their admin (invariant 5).
    expect(await followupOf(inFollowup.followupId)).toMatchObject({ status: 'TRANSFERRED', openKey: '', adminId: ids.agent });
    expect((await followupOf(inFollowup.followupId)).closedAt).toBeTruthy();
    expect(await ownershipOf(inFollowup.ownershipId)).toMatchObject({ endReason: 'TRANSFERRED', openUserKey: '', adminId: ids.agent });

    // The target has new ones, linked, with the remaining deadline and windows.
    const [newOwnership] = await readAll('ownerships', { openUserKey: { eq: inFollowup.personId } }, { state: true, adminId: true });
    const [newFollowup] = await readAll('followups', { openKey: { eq: inFollowup.personId } }, {
      status: true,
      adminId: true,
      deadlineAt: true,
      transferredFrom: true,
    });

    expect(newOwnership).toMatchObject({ state: 'IN_FOLLOWUP', adminId: ids.other });
    expect(newFollowup).toMatchObject({ status: 'IN_PROGRESS', adminId: ids.other, transferredFrom: inFollowup.followupId });
    expect(Math.abs(new Date(newFollowup.deadlineAt).getTime() - new Date(oldFollowup.deadlineAt).getTime())).toBeLessThan(5 * 60_000);

    const newTouches = await touchesOf(newFollowup.id);

    expect(newTouches.map(({ touchNo }) => touchNo).sort()).toEqual(
      oldTouches.filter(({ status }) => status === 'OPEN').map(({ touchNo }) => touchNo).sort(),
    );
    expect(newTouches.every(({ adminId }) => adminId === ids.other)).toBe(true);
    expect((await personOf(inFollowup.personId)).currentOwnerId).toBe(ids.other);

    // Successful users move as successful, rebuy users keep their remaining hours.
    expect(await readAll('ownerships', { openUserKey: { eq: successful.personId } }, { state: true, adminId: true })).toMatchObject([
      { state: 'SUCCESSFUL', adminId: ids.other },
    ]);
    expect(await readAll('followups', { openKey: { eq: successful.personId } }, {})).toHaveLength(0);

    const [rebuyCase] = await readAll('followups', { openKey: { eq: rebuy.personId } }, { kind: true, status: true, deadlineAt: true });

    expect(rebuyCase).toMatchObject({ kind: 'REBUY', status: 'REBUY_PENDING' });
    expect(Math.abs(new Date(rebuyCase.deadlineAt).getTime() - (Date.now() + 50 * HOUR_MS))).toBeLessThan(10 * 60_000);

    // TRF-02: the new owner reads the earlier call and its note with their own token.
    const { data, errors } = await userRequest<{ calls: { edges: { node: { note: string } }[] } }>({
      token: tokens.other,
      query: `{ calls(filter: { personId: { eq: "${inFollowup.personId}" } }) { edges { node { note } } } }`,
    });

    expect(errors).toBeUndefined();
    expect(data?.calls.edges.map(({ node }) => node.note)).toEqual([`call ${inFollowup.proopcoId}`]);

    expect(await auditOf(inFollowup.personId, 'TRANSFER')).toMatchObject([{ actorId: ids.supervisor, reason: 'Workload' }]);

    // A rerun skips users already with the target.
    const rerun = await route('supervisor', TRANSFER_USERS_ROUTE_PATH, { personIds, toAdminId: ids.other, reason: 'Workload' });

    expect(rerun.results?.map(({ status }) => status)).toEqual(['SKIPPED', 'SKIPPED', 'SKIPPED']);
    expect(await auditOf(inFollowup.personId, 'TRANSFER')).toHaveLength(1);
  });

  it('refuses deactivation while the admin owns users, then deactivates after release (S14)', async () => {
    const [existing] = await readAll('ownerships', { adminId: { eq: ids.other }, openUserKey: { is: 'NOT_NULL' } }, {});

    expect(existing).toBeTruthy();
    expect((await route('supervisor', DEACTIVATE_ADMIN_ROUTE_PATH, { adminId: ids.other, reason: 'Left' })).error).toBe(NOT_ALLOWED_MESSAGE);
    expect(await route('full', DEACTIVATE_ADMIN_ROUTE_PATH, { adminId: ids.other, reason: 'Left' })).toMatchObject({
      success: false,
      error: expect.stringContaining('still owns users'),
    });
    expect((await statusOf('other')).crmStatus).toBe('ACTIVE');

    const released = await route('supervisor', RELEASE_USERS_ROUTE_PATH, { fromAdminId: ids.other, reason: 'Left the company' });

    expect(released.success).toBe(true);
    expect(released.results?.length).toBeGreaterThanOrEqual(3);
    expect(released.results?.every(({ status }) => status === 'DONE')).toBe(true);

    const releasedId = released.results![0].personId;

    expect(await readAll('ownerships', { adminId: { eq: ids.other }, openUserKey: { is: 'NOT_NULL' } }, {})).toHaveLength(0);
    expect((await personOf(releasedId)).currentOwnerId).toBeNull();
    expect(await readAll('ownerships', { personId: { eq: releasedId } }, { endReason: true })).toContainEqual(
      expect.objectContaining({ endReason: 'RELEASED_BY_MANAGER' }),
    );
    expect(
      await readAll('followups', { personId: { in: released.results!.map(({ personId }) => personId) } }, { status: true }),
    ).toContainEqual(expect.objectContaining({ status: 'RELEASED_BY_MANAGER' }));
    expect(await auditOf(releasedId, 'RELEASE_USER')).toMatchObject([{ actorId: ids.supervisor, reason: 'Left the company' }]);

    expect(await route('full', DEACTIVATE_ADMIN_ROUTE_PATH, { adminId: ids.other, reason: '' })).toMatchObject({ success: false });
    expect(await route('full', DEACTIVATE_ADMIN_ROUTE_PATH, { adminId: ids.other, reason: 'Left the company' })).toEqual({ success: true });
    expect((await statusOf('other')).crmStatus).toBe('DEACTIVATED');
    expect(await auditOf(ids.other, 'DEACTIVATE_ADMIN')).toMatchObject([{ actorId: ids.full, reason: 'Left the company' }]);
  });

  it('lists admins for supervisors and refuses sales admins', async () => {
    expect((await route('agent', ADMINS_ROUTE_PATH, {})).error).toBe(NOT_ALLOWED_MESSAGE);

    const { admins } = await route('supervisor', ADMINS_ROUTE_PATH, {});

    expect(admins?.find(({ memberId }) => memberId === ids.other)?.status).toBe('DEACTIVATED');
  });

  it('flags a freeze that reached day 7 once, in the audit log (FRZ-05)', async () => {
    expect(await freeze('supervisor', 'agent', 'Long leave')).toEqual({ success: true });

    const flag = async (referenceDate: Date) =>
      (
        await postRoute({
          path: FLAG_LONG_FREEZES_ROUTE_PATH,
          headers: { [PROOPCO_SYNC_TOKEN_HEADER]: TEST_SYNC_TOKEN },
          body: { referenceDate: referenceDate.toISOString() },
        })
      ).data;

    expect(await flag(new Date(Date.now() + 5 * DAY_MS))).toMatchObject({ success: true, flagged: 0 });
    expect(await flag(new Date(Date.now() + 8 * DAY_MS))).toMatchObject({ success: true, flagged: 1 });
    expect(await flag(new Date(Date.now() + 9 * DAY_MS))).toMatchObject({ success: true, flagged: 0 });
    expect(await auditOf(ids.agent, 'LONG_FREEZE_WARNING')).toMatchObject([{ actorId: null }]);

    const { admins } = await route('supervisor', ADMINS_ROUTE_PATH, {});

    expect(admins?.find(({ memberId }) => memberId === ids.agent)).toMatchObject({ status: 'FROZEN', daysFrozen: 0 });
    expect(await unfreeze('supervisor', 'agent')).toEqual({ success: true });
  });

  it('lets no role edit or delete an audit entry', async () => {
    const [entry] = await readAll('auditLogs', { action: { eq: 'FREEZE' } }, {});

    for (const who of ['agent', 'supervisor', 'full']) {
      for (const mutation of [
        `updateAuditLog(id: "${entry.id}", data: { reason: "edited" })`,
        `deleteAuditLog(id: "${entry.id}")`,
        `destroyAuditLog(id: "${entry.id}")`,
        `createAuditLog(data: { action: TRANSFER, subjectId: "forged" })`,
      ]) {
        const { errors } = await userRequest({ token: tokens[who], query: `mutation { ${mutation} { id } }` });

        expect(errors?.length, `${who}: ${mutation}`).toBeGreaterThan(0);
      }
    }

    expect((await readAll('auditLogs', { id: { eq: entry.id } }, { reason: true }))[0].reason).not.toBe('edited');
  });

  it('hides the audit log from sales admins', async () => {
    const { data, errors } = await userRequest<{ auditLogs: { edges: unknown[] } }>({
      token: tokens.agent,
      query: '{ auditLogs(first: 5) { edges { node { id } } } }',
    });

    expect(errors?.length ?? data?.auditLogs.edges.length).toBeTruthy();
  });
});
