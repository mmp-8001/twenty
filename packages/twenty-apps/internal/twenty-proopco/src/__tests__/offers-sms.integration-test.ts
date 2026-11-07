import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { TRANSFER_USERS_ROUTE_PATH } from '../constants/admin-management.constant';
import {
  ACTIVATE_OFFER_ROUTE_PATH,
  DEACTIVATE_OFFER_ROUTE_PATH,
  OFFER_ALREADY_ACTIVE_MESSAGE,
  OFFER_NOT_AVAILABLE_MESSAGE,
  OFFER_OPTIONS_ROUTE_PATH,
  RESEND_OFFER_SMS_ROUTE_PATH,
} from '../constants/offer.constant';
import { NOT_ALLOWED_MESSAGE } from '../constants/admin-management.constant';
import { ADD_TO_FOLLOWUP_ROUTE_PATH } from '../constants/ownership.constant';
import { postRoute, postSyncRoute } from './post-sync-route';
import { mutate, query, setServerVariable, tokenHeaders, uniqueId } from './sales-core-helpers';
import {
  assignSeededRoles,
  SEEDED_AGENT_EMAIL,
  SEEDED_MANAGER_EMAIL,
  SEEDED_OTHER_AGENT_EMAIL,
  signIn,
  userRequest,
} from './seeded-sessions';
import { startStubServer } from './stub-server';

const DAY_MS = 24 * 60 * 60 * 1000;
const SUPERVISOR_EMAIL = 'scott.forstall@apple.dev';

type RouteResult = {
  success: boolean;
  error?: string;
  activationId?: string;
  smsStatus?: string;
  options?: { id: string; activation: { status: string } | null }[];
  voidedCount?: number;
};
type Row = Record<string, any>;
type CodeRequest = { userProopcoId: string; capability: string; params: unknown; expiresAt: string };
type SmsRequest = { messages: { to: string; body: string; sourceRef: string }[] };

describe('Offers and SMS', () => {
  const tag = uniqueId('off');
  const created: { singular: string; id: string }[] = [];
  const tokens: Record<string, string> = {};
  const ids: Record<string, string> = {};
  const failingProopcoIds = new Set<string>();
  let smsShouldFail = false;
  let restoreRoles: () => Promise<void>;
  let stopStubs: () => Promise<void>;
  let codeRequests: { body: CodeRequest }[] = [];
  let smsRequests: { headers: Record<string, unknown>; body: SmsRequest }[] = [];
  let campaignId: string;

  const create = async (singular: string, data: Record<string, unknown>) => {
    const result = await mutate({ [`create${singular}`]: { __args: { data }, id: true } });
    const id = result[`create${singular}`].id as string;

    created.push({ singular, id });

    return id;
  };

  const readAll = async (collection: string, filter: Record<string, unknown>, selection: object): Promise<Row[]> => {
    const result = await query({
      [collection]: { __args: { filter, first: 50 }, edges: { node: { id: true, ...selection } } },
    });

    return (result[collection].edges as { node: Row }[]).map(({ node }) => node);
  };

  const route = async (who: string, path: string, body: unknown) =>
    (await postRoute({ path, headers: { authorization: `Bearer ${tokens[who]}` }, body })).data as RouteResult;

  const createOffer = (suffix: string, data: Record<string, unknown> = {}) =>
    create('Offer', {
      title: `${tag}-${suffix}`,
      capability: 'RESET',
      discountParams: { percent: 50 },
      expiresAt: new Date(Date.now() + 30 * DAY_MS).toISOString(),
      ...data,
    });

  const activationsOf = (personId: string) =>
    readAll('offerActivations', { personId: { eq: personId } }, {
      status: true,
      smsStatus: true,
      code: true,
      externalCodeId: true,
      errorMessage: true,
      adminId: true,
      callId: true,
      offerId: true,
      usedAt: true,
      usedAccount: true,
    });

  type TestUser = { personId: string; proopcoId: string; followupId: string; ownershipId: string; callId: string };

  // Owned through the real route, then put in the requested case with one answered (or not) call.
  const caseUser = async (
    suffix: string,
    kind: 'CAMPAIGN' | 'REBUY' | 'RETENTION',
    { isAnswered = true }: { isAnswered?: boolean } = {},
  ): Promise<TestUser> => {
    const proopcoId = `${tag}-${suffix}`;
    const personId = await create('Person', {
      name: { firstName: 'Off', lastName: proopcoId },
      proopcoId,
      phones: { primaryPhoneNumber: '9121234567', primaryPhoneCallingCode: '+98' },
      visibleToMemberIds: [ids.agent],
    });

    expect(await route('agent', ADD_TO_FOLLOWUP_ROUTE_PATH, { personId })).toMatchObject({ success: true });

    const [followup] = await readAll('followups', { openKey: { eq: personId } }, {});
    const [ownership] = await readAll('ownerships', { openUserKey: { eq: personId } }, {});

    if (kind === 'CAMPAIGN') {
      await mutate({ updateFollowup: { __args: { id: followup.id, data: { campaignId } }, id: true } });
    }

    if (kind === 'REBUY') {
      await mutate({
        updateFollowup: {
          __args: {
            id: followup.id,
            data: { kind: 'REBUY', status: 'IN_PROGRESS', deadlineAt: new Date(Date.now() + 30 * DAY_MS).toISOString() },
          },
          id: true,
        },
      });
    }

    if (kind === 'RETENTION') {
      await mutate({
        updateFollowup: { __args: { id: followup.id, data: { status: 'SUCCESSFUL', openKey: null } }, id: true },
      });
      await mutate({ updateOwnership: { __args: { id: ownership.id, data: { state: 'SUCCESSFUL' } }, id: true } });
    }

    const callId = await create('Call', {
      personId,
      adminId: ids.agent,
      ownershipId: ownership.id,
      followupId: kind === 'RETENTION' ? null : followup.id,
      kind: kind === 'RETENTION' ? 'RETENTION' : 'FOLLOWUP',
      startedAt: new Date().toISOString(),
      technicalStatus: isAnswered ? 'ANSWERED' : 'NO_ANSWER',
      isAnswered,
      source: 'MANUAL',
    });

    return { personId, proopcoId, followupId: followup.id, ownershipId: ownership.id, callId };
  };

  const activate = (who: string, user: TestUser, offerId: string) =>
    route(who, ACTIVATE_OFFER_ROUTE_PATH, { personId: user.personId, offerId, callId: user.callId });
  const optionsOf = async (who: string, user: TestUser) => {
    const result = await route(who, OFFER_OPTIONS_ROUTE_PATH, { callId: user.callId });

    expect(result.success).toBe(true);

    return result.options ?? [];
  };

  beforeAll(async () => {
    const assigned = await assignSeededRoles([
      { email: SEEDED_AGENT_EMAIL, roleLabel: 'Sales Agent' },
      { email: SEEDED_OTHER_AGENT_EMAIL, roleLabel: 'Sales Agent' },
      { email: SUPERVISOR_EMAIL, roleLabel: 'Supervisor' },
      { email: SEEDED_MANAGER_EMAIL, roleLabel: 'Full Admin' },
    ]);
    const emails = {
      agent: SEEDED_AGENT_EMAIL,
      other: SEEDED_OTHER_AGENT_EMAIL,
      supervisor: SUPERVISOR_EMAIL,
      full: SEEDED_MANAGER_EMAIL,
    };

    restoreRoles = assigned.restore;

    for (const [name, email] of Object.entries(emails)) {
      ids[name] = assigned.memberIds[email];
      tokens[name] = await signIn(email);
    }

    const proopco = await startStubServer<CodeRequest>((request) => {
      codeRequests.push({ body: request.body });

      return failingProopcoIds.has(request.body.userProopcoId)
        ? { status: 422, body: { message: 'Code service refused' } }
        : { status: 200, body: { id: `ext-${codeRequests.length}`, code: `CODE-${codeRequests.length}-${tag}`.toUpperCase() } };
    });
    const sms = await startStubServer<SmsRequest>((request) => {
      smsRequests.push({ headers: request.headers, body: request.body });

      return smsShouldFail
        ? { status: 500, body: { success: false, error: 'SMS app down' } }
        : { status: 200, body: { success: true, results: [{ sourceRef: request.body.messages[0].sourceRef, status: 'queued' }] } };
    });

    stopStubs = async () => {
      await proopco.stop();
      await sms.stop();
    };
    await setServerVariable('CODE_SERVICE_PROVIDER', 'http');
    await setServerVariable('PROOPCO_API_BASE_URL', proopco.url);
    await setServerVariable('PROOPCO_API_KEY', 'proopco-test-key');
    await setServerVariable('SMS_ENQUEUE_URL', `${sms.url}/s/sms/enqueue`);
    await setServerVariable('SMS_ENQUEUE_TOKEN', 'sms-test-token');

    // Ended, so the campaign never feeds visibility lists.
    campaignId = await create('Campaign', {
      name: `${tag}-campaign`,
      segmentViewId: 'none',
      status: 'ENDED',
      startsAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
      endsAt: new Date(Date.now() - DAY_MS).toISOString(),
    });
  });

  afterAll(async () => {
    await restoreRoles?.();
    await stopStubs?.();

    for (const key of ['CODE_SERVICE_PROVIDER', 'PROOPCO_API_BASE_URL', 'PROOPCO_API_KEY', 'SMS_ENQUEUE_URL', 'SMS_ENQUEUE_TOKEN']) {
      await setServerVariable(key, '').catch(() => undefined);
    }

    for (const { singular, id } of [...created].reverse()) {
      await mutate({ [`destroy${singular}`]: { __args: { id }, id: true } }).catch(() => undefined);
    }
  });

  it('activates a campaign offer on an answered call and texts code, capability and expiry (DS1)', async () => {
    const offerId = await createOffer('ds1');

    await create('CampaignOffer', { campaignId, offerId });

    const user = await caseUser('ds1', 'CAMPAIGN');

    expect((await optionsOf('agent', user)).map(({ id }) => id)).toContain(offerId);

    const result = await activate('agent', user, offerId);

    expect(result).toMatchObject({ success: true, smsStatus: 'SENT' });

    const [activation] = await activationsOf(user.personId);
    const [offer] = await readAll('offers', { id: { eq: offerId } }, { expiresAt: true });

    expect(activation).toMatchObject({ status: 'ACTIVE', smsStatus: 'SENT', adminId: ids.agent, offerId });
    expect(activation.code).toMatch(/^CODE-/);
    expect(codeRequests[codeRequests.length - 1]?.body).toMatchObject({
      userProopcoId: user.proopcoId,
      capability: 'reset',
      params: { percent: 50 },
    });

    const sms = smsRequests[smsRequests.length - 1];

    expect(sms.headers['x-sms-enqueue-token']).toBe('sms-test-token');
    expect(sms.body.messages[0]).toMatchObject({
      to: '+989121234567',
      sourceRef: `offer-activation:${result.activationId}`,
    });
    expect(sms.body.messages[0].body).toContain(activation.code);
    expect(sms.body.messages[0].body).toContain('reset');
    expect(sms.body.messages[0].body).toContain(new Date(offer.expiresAt).toISOString().slice(0, 10));
  });

  it('never activates one offer twice for one user, also under a race (invariant 8)', async () => {
    const offerId = await createOffer('twice');

    await create('CampaignOffer', { campaignId, offerId });

    const user = await caseUser('twice', 'CAMPAIGN');
    const before = codeRequests.length;
    const results = await Promise.all([activate('agent', user, offerId), activate('agent', user, offerId)]);

    expect(results.filter(({ success }) => success)).toHaveLength(1);
    expect(results.find(({ success }) => !success)?.error).toBe(OFFER_ALREADY_ACTIVE_MESSAGE);
    expect(codeRequests.length - before).toBe(1);
    expect(await activationsOf(user.personId)).toHaveLength(1);
    expect((await activate('agent', user, offerId)).error).toBe(OFFER_ALREADY_ACTIVE_MESSAGE);
  });

  it('shows an active offer disabled and hides an expired one (DS2)', async () => {
    const activeId = await createOffer('ds2-active');
    const expiredId = await createOffer('ds2-expired', { expiresAt: new Date(Date.now() - DAY_MS).toISOString() });

    await create('CampaignOffer', { campaignId, offerId: activeId });
    await create('CampaignOffer', { campaignId, offerId: expiredId });

    const user = await caseUser('ds2', 'CAMPAIGN');

    await activate('agent', user, activeId);

    const options = await optionsOf('agent', user);

    expect(options.find(({ id }) => id === activeId)?.activation).toMatchObject({ status: 'ACTIVE' });
    expect(options.find(({ id }) => id === expiredId)).toBeUndefined();
    expect((await activate('agent', user, expiredId)).error).toBe(OFFER_NOT_AVAILABLE_MESSAGE);
  });

  it('offers the rebuy set on a rebuy case and the retention set on retention calls, hiding empty sets (DS3, RS2)', async () => {
    const rebuyOfferId = await createOffer('rebuy');
    const retentionOfferId = await createOffer('retention');
    const campaignOfferId = await createOffer('campaign-only');

    await create('OfferSet', { setType: 'REBUY', offerId: rebuyOfferId });
    await create('OfferSet', { setType: 'RETENTION', offerId: retentionOfferId });
    await create('CampaignOffer', { campaignId, offerId: campaignOfferId });

    const rebuy = await caseUser('ds3-rebuy', 'REBUY');
    const retention = await caseUser('ds3-retention', 'RETENTION');

    const rebuyOptions = (await optionsOf('agent', rebuy)).map(({ id }) => id);
    const retentionOptions = (await optionsOf('agent', retention)).map(({ id }) => id);

    expect(rebuyOptions).toContain(rebuyOfferId);
    expect(rebuyOptions).not.toContain(retentionOfferId);
    expect(rebuyOptions).not.toContain(campaignOfferId);
    expect(retentionOptions).toContain(retentionOfferId);
    expect(retentionOptions).not.toContain(rebuyOfferId);
    expect((await activate('agent', rebuy, retentionOfferId)).error).toBe(OFFER_NOT_AVAILABLE_MESSAGE);
    expect(await activate('agent', retention, retentionOfferId)).toMatchObject({ success: true });

    // A campaign with no linked offers hides the section.
    const otherCampaignId = await create('Campaign', {
      name: `${tag}-empty`,
      segmentViewId: 'none',
      status: 'ENDED',
      startsAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
      endsAt: new Date(Date.now() - DAY_MS).toISOString(),
    });
    const empty = await caseUser('ds3-empty', 'CAMPAIGN');

    await mutate({ updateFollowup: { __args: { id: empty.followupId, data: { campaignId: otherCampaignId } }, id: true } });
    expect(await optionsOf('agent', empty)).toEqual([]);
  });

  it('refuses a caller who is not the owner or a call that was not answered', async () => {
    const offerId = await createOffer('refused');

    await create('CampaignOffer', { campaignId, offerId });

    const user = await caseUser('refused', 'CAMPAIGN');
    const unanswered = await caseUser('refused-unanswered', 'CAMPAIGN', { isAnswered: false });

    expect((await activate('other', user, offerId)).success).toBe(false);
    expect((await activate('agent', unanswered, offerId)).success).toBe(false);
    expect(await optionsOf('agent', unanswered)).toEqual([]);
    expect(await activationsOf(user.personId)).toHaveLength(0);
  });

  it('keeps the call when the code service fails and retries the same activation (DS4a)', async () => {
    const offerId = await createOffer('ds4a');

    await create('CampaignOffer', { campaignId, offerId });

    const user = await caseUser('ds4a', 'CAMPAIGN');
    const smsBefore = smsRequests.length;

    failingProopcoIds.add(user.proopcoId);

    const failed = await activate('agent', user, offerId);

    expect(failed).toMatchObject({ success: false, error: 'Code service refused' });

    const [activation] = await activationsOf(user.personId);

    expect(activation).toMatchObject({ status: 'ACTIVATION_FAILED', errorMessage: 'Code service refused', code: '' });
    expect((await readAll('calls', { id: { eq: user.callId } }, {})).length).toBe(1);
    expect(smsRequests.length).toBe(smsBefore);

    failingProopcoIds.delete(user.proopcoId);

    // Retry without the call id, as User details does.
    const retried = await route('agent', ACTIVATE_OFFER_ROUTE_PATH, { personId: user.personId, offerId });

    expect(retried).toMatchObject({ success: true, activationId: activation.id });
    expect(await activationsOf(user.personId)).toMatchObject([{ id: activation.id, status: 'ACTIVE', smsStatus: 'SENT' }]);
  });

  it('keeps the code active when the SMS cannot be queued and resends it (DS4b)', async () => {
    const offerId = await createOffer('ds4b');

    await create('CampaignOffer', { campaignId, offerId });

    const user = await caseUser('ds4b', 'CAMPAIGN');

    smsShouldFail = true;

    const result = await activate('agent', user, offerId);

    expect(result).toMatchObject({ success: true, smsStatus: 'FAILED' });
    expect(await activationsOf(user.personId)).toMatchObject([{ status: 'ACTIVE', smsStatus: 'FAILED' }]);
    expect(await route('agent', RESEND_OFFER_SMS_ROUTE_PATH, { activationId: result.activationId })).toMatchObject({
      success: false,
      error: 'SMS not sent',
    });

    smsShouldFail = false;

    expect(await route('other', RESEND_OFFER_SMS_ROUTE_PATH, { activationId: result.activationId })).toMatchObject({
      success: false,
    });
    expect(await route('agent', RESEND_OFFER_SMS_ROUTE_PATH, { activationId: result.activationId })).toMatchObject({
      success: true,
      smsStatus: 'SENT',
    });
    expect(await activationsOf(user.personId)).toMatchObject([{ status: 'ACTIVE', smsStatus: 'SENT' }]);
    // The same sourceRef every time, so the SMS app texts the user once.
    expect(new Set(smsRequests.slice(-3).map(({ body }) => body.messages[0].sourceRef)).size).toBe(1);
  });

  it('voids a deactivated offer for every user without an SMS, and audits it (DS5, DS6)', async () => {
    const offerId = await createOffer('ds5');

    await create('CampaignOffer', { campaignId, offerId });

    const first = await caseUser('ds5-a', 'CAMPAIGN');
    const second = await caseUser('ds5-b', 'CAMPAIGN');

    await activate('agent', first, offerId);
    await activate('agent', second, offerId);

    const smsBefore = smsRequests.length;

    for (const who of ['agent', 'supervisor']) {
      expect((await route(who, DEACTIVATE_OFFER_ROUTE_PATH, { offerId })).error).toBe(NOT_ALLOWED_MESSAGE);
    }

    expect(await route('full', DEACTIVATE_OFFER_ROUTE_PATH, { offerId, reason: 'Too generous' })).toEqual({
      success: true,
      voidedCount: 2,
    });

    const [offer] = await readAll('offers', { id: { eq: offerId } }, { status: true, deactivatedAt: true, deactivatedById: true });

    expect(offer).toMatchObject({ status: 'DEACTIVATED', deactivatedById: ids.full });
    expect(offer.deactivatedAt).toBeTruthy();
    expect(await activationsOf(first.personId)).toMatchObject([{ status: 'DEACTIVATED' }]);
    expect(await activationsOf(second.personId)).toMatchObject([{ status: 'DEACTIVATED' }]);
    expect(smsRequests.length).toBe(smsBefore);
    expect((await optionsOf('agent', first)).find(({ id }) => id === offerId)).toBeUndefined();
    expect((await activate('agent', first, offerId)).success).toBe(false);
    expect(
      await readAll('auditLogs', { subjectId: { eq: offerId }, action: { eq: 'DEACTIVATE_OFFER' } }, { actorId: true, reason: true }),
    ).toMatchObject([{ actorId: ids.full, reason: 'Too generous' }]);
    expect((await route('full', DEACTIVATE_OFFER_ROUTE_PATH, { offerId })).success).toBe(false);
  });

  it('credits the activating agent when a purchase uses the code, whoever owns the user later (RS2)', async () => {
    const offerId = await createOffer('rs2');

    await create('OfferSet', { setType: 'RETENTION', offerId });

    const user = await caseUser('rs2', 'RETENTION');

    await activate('agent', user, offerId);

    const [activation] = await activationsOf(user.personId);

    expect(
      (
        await route('supervisor', TRANSFER_USERS_ROUTE_PATH, {
          personIds: [user.personId],
          toAdminId: ids.other,
          reason: 'Workload',
        })
      ).success,
    ).toBe(true);

    const paidAt = new Date().toISOString();
    const { data } = await postSyncRoute({
      headers: tokenHeaders,
      body: {
        items: [
          { type: 'account', proopcoId: `${user.proopcoId}-a1`, data: { userProopcoId: user.proopcoId, status: 'active' } },
          {
            type: 'payment',
            proopcoId: `${user.proopcoId}-pay`,
            data: {
              userProopcoId: user.proopcoId,
              accountProopcoId: `${user.proopcoId}-a1`,
              amountToman: 600000,
              amountUsdt: 10,
              paidAt,
              offerCode: activation.code,
            },
          },
        ],
      },
    });

    expect(data.success).toBe(true);

    const [used] = await activationsOf(user.personId);
    const [commission] = await readAll('commissions', { personId: { eq: user.personId } }, { adminId: true });

    expect(used).toMatchObject({ status: 'USED', adminId: ids.agent, usedAccount: expect.any(String) });
    expect(new Date(used.usedAt).toISOString()).toBe(paidAt);
    expect(commission.adminId).toBe(ids.other);
  });

  it('lets a Supervisor link offers but not create offers or edit global settings (AS1)', async () => {
    const graphql = (who: string, mutation: string, variables: Record<string, unknown> = {}) =>
      userRequest<Record<string, { id: string }>>({ token: tokens[who], query: mutation, variables });
    const expiresAt = new Date(Date.now() + DAY_MS).toISOString();
    const createOfferMutation = `mutation ($data: OfferCreateInput!) { createOffer(data: $data) { id } }`;
    const offerData = { title: `${tag}-as1`, capability: 'DISCOUNT', expiresAt };

    for (const who of ['supervisor', 'agent']) {
      expect((await graphql(who, createOfferMutation, { data: offerData })).errors?.length).toBeGreaterThan(0);
    }

    const full = await graphql('full', createOfferMutation, { data: offerData });

    expect(full.errors).toBeUndefined();
    created.push({ singular: 'Offer', id: full.data!.createOffer.id });

    // The status changes only through the deactivate route, which audits it.
    expect(
      (
        await graphql(
          'full',
          `mutation ($id: UUID!) { updateOffer(id: $id, data: { status: DEACTIVATED }) { id } }`,
          { id: full.data!.createOffer.id },
        )
      ).errors?.length,
    ).toBeGreaterThan(0);

    const offerId = full.data!.createOffer.id;
    const link = await graphql(
      'supervisor',
      `mutation ($data: CampaignOfferCreateInput!) { createCampaignOffer(data: $data) { id } }`,
      { data: { campaignId, offerId } },
    );

    expect(link.errors).toBeUndefined();
    created.push({ singular: 'CampaignOffer', id: link.data!.createCampaignOffer.id });

    expect(
      (
        await graphql(
          'supervisor',
          `mutation ($id: UUID!) { updateOffer(id: $id, data: { title: "changed" }) { id } }`,
          { id: offerId },
        )
      ).errors?.length,
    ).toBeGreaterThan(0);
    expect(
      (
        await graphql(
          'supervisor',
          `mutation ($data: OfferSetCreateInput!) { createOfferSet(data: $data) { id } }`,
          { data: { setType: 'REBUY', offerId } },
        )
      ).errors?.length,
    ).toBeGreaterThan(0);
    expect(
      (
        await graphql('agent', `mutation ($data: CampaignOfferCreateInput!) { createCampaignOffer(data: $data) { id } }`, {
          data: { campaignId, offerId },
        })
      ).errors?.length,
    ).toBeGreaterThan(0);
  });
});
