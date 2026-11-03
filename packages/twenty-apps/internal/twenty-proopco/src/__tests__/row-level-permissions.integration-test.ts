import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  commissionsOfPayment,
  createFollowup,
  createPayment,
  createTrader,
  mutate,
  query,
  runCommission,
  uniqueId,
} from './sales-core-helpers';
import {
  assignSeededRoles,
  SEEDED_AGENT_EMAIL,
  SEEDED_OTHER_AGENT_EMAIL,
  signIn,
  userRequest,
} from './seeded-sessions';

type Page = { edges: { node: { id: string } }[] };

describe('Sales Agent row-level access', () => {
  let agentToken: string;
  let restoreRoles: () => Promise<void>;
  let agentId: string;
  let otherAgentId: string;
  let ownFollowupId: string;
  let poolFollowupId: string;
  let othersFollowupId: string;
  let ownCommissionId: string;
  let othersCommissionId: string;
  let ownNoteId: string;
  let othersNoteId: string;

  const idsOf = async (collection: string) => {
    const { data, errors } = await userRequest<Record<string, Page>>({
      token: agentToken,
      query: `{ ${collection}(first: 200) { edges { node { id } } } }`,
    });

    expect(errors).toBeUndefined();

    return data![collection].edges.map(({ node }) => node.id);
  };

  const createNoteAs = async (token: string) => {
    const { data, errors } = await userRequest<{ createNote: { id: string } }>({
      token,
      query: `mutation ($title: String!) { createNote(data: { title: $title }) { id } }`,
      variables: { title: uniqueId('note') },
    });

    expect(errors).toBeUndefined();

    return data!.createNote.id;
  };

  beforeAll(async () => {
    const assigned = await assignSeededRoles([
      { email: SEEDED_AGENT_EMAIL, roleLabel: 'Sales Agent' },
      { email: SEEDED_OTHER_AGENT_EMAIL, roleLabel: 'Sales Agent' },
    ]);

    restoreRoles = assigned.restore;
    agentId = assigned.memberIds[SEEDED_AGENT_EMAIL];
    otherAgentId = assigned.memberIds[SEEDED_OTHER_AGENT_EMAIL];
    agentToken = await signIn(SEEDED_AGENT_EMAIL);

    ownFollowupId = await createFollowup({
      traderId: await createTrader('own'),
      ownerId: agentId,
    });
    poolFollowupId = await createFollowup({
      traderId: await createTrader('pool'),
      ownerId: null,
    });
    othersFollowupId = await createFollowup({
      traderId: await createTrader('others'),
      ownerId: otherAgentId,
    });

    // Commissions are written by the app only, so they arrive through the payment flow.
    const createCommissionFor = async (ownerId: string, suffix: string) => {
      const traderId = await createTrader(suffix);

      await createFollowup({ traderId, ownerId });

      const paymentId = await createPayment({ traderId, amountUsd: 100 });

      await runCommission(paymentId);

      return (await commissionsOfPayment(paymentId))[0].id as string;
    };

    ownCommissionId = await createCommissionFor(agentId, 'commission-own');
    othersCommissionId = await createCommissionFor(
      otherAgentId,
      'commission-others',
    );
    ownNoteId = await createNoteAs(agentToken);
    othersNoteId = await createNoteAs(await signIn(SEEDED_OTHER_AGENT_EMAIL));
  });

  afterAll(async () => {
    await restoreRoles?.();

    for (const [singular, ids] of [
      ['Followup', [ownFollowupId, poolFollowupId, othersFollowupId]],
      ['Note', [ownNoteId, othersNoteId]],
    ] as const) {
      for (const id of ids.filter(Boolean)) {
        await mutate({ [`destroy${singular}`]: { __args: { id }, id: true } });
      }
    }
  });

  it('sees own Followups and the Pool but not other agents Followups', async () => {
    const visible = await idsOf('followups');

    expect(visible).toContain(ownFollowupId);
    expect(visible).toContain(poolFollowupId);
    expect(visible).not.toContain(othersFollowupId);
  });

  it('sees only own Commissions', async () => {
    const visible = await idsOf('commissions');

    expect(visible).toContain(ownCommissionId);
    expect(visible).not.toContain(othersCommissionId);
  });

  it('sees only own Notes', async () => {
    const visible = await idsOf('notes');

    expect(visible).toContain(ownNoteId);
    expect(visible).not.toContain(othersNoteId);
  });

  it('reads Followup Types and Commission Tiers but cannot edit them', async () => {
    expect((await idsOf('followupTypes')).length).toBeGreaterThan(0);
    expect((await idsOf('commissionTiers')).length).toBeGreaterThan(0);

    const { followupTypes } = await query({
      followupTypes: { __args: { first: 1 }, edges: { node: { id: true } } },
    });
    const { commissionTiers } = await query({
      commissionTiers: { __args: { first: 1 }, edges: { node: { id: true } } },
    });
    const followupTypeEdit = await userRequest({
      token: agentToken,
      query: `mutation ($id: UUID!) { updateFollowupType(id: $id, data: { name: "Edited" }) { id } }`,
      variables: { id: followupTypes.edges[0].node.id },
    });
    const commissionTierEdit = await userRequest({
      token: agentToken,
      query: `mutation ($id: UUID!) { updateCommissionTier(id: $id, data: { name: "Edited" }) { id } }`,
      variables: { id: commissionTiers.edges[0].node.id },
    });

    expect(followupTypeEdit.errors?.length).toBeGreaterThan(0);
    expect(commissionTierEdit.errors?.length).toBeGreaterThan(0);
  });
});
