import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PROOPCO_SYNC_TOKEN_HEADER } from '../constants/proopco-sync.constant';
import { metadataRequest } from './metadata-request';
import { postRoute } from './post-sync-route';
import { mutate, query, uniqueId, waitFor } from './sales-core-helpers';
import {
  assignSeededRoles,
  SEEDED_AGENT_EMAIL,
  SEEDED_MANAGER_EMAIL,
  SEEDED_OTHER_AGENT_EMAIL,
  signIn,
  userRequest,
} from './seeded-sessions';
import { TEST_SYNC_TOKEN } from './test-constants';

const DAY_MS = 24 * 60 * 60 * 1000;

type Connection = {
  totalCount: number;
  edges: { node: { id: string } }[];
};

describe('Sales Admin visibility and campaigns', () => {
  const tag = uniqueId('vis');
  const created: { singular: string; id: string }[] = [];
  let agentToken: string;
  let otherAgentToken: string;
  let supervisorToken: string;
  let agentId: string;
  let otherAgentId: string;
  let restoreRoles: () => Promise<void>;
  let personObjectId: string;

  const create = async (singular: string, data: Record<string, unknown>) => {
    const result = await mutate({
      [`create${singular}`]: { __args: { data }, id: true },
    });
    const id = result[`create${singular}`].id as string;

    created.push({ singular, id });

    return id;
  };

  const createPerson = (suffix: string, data: Record<string, unknown> = {}) =>
    create('Person', {
      name: { firstName: 'Vis', lastName: `${tag}-${suffix}` },
      kycStatus: tag,
      ...data,
    });

  const peopleSeenBy = async (token: string) => {
    const { data, errors } = await userRequest<{ people: Connection }>({
      token,
      query: `query ($filter: PersonFilterInput) {
        people(first: 200, filter: $filter) { totalCount edges { node { id } } }
      }`,
      variables: { filter: { kycStatus: { eq: tag } } },
    });

    expect(errors).toBeUndefined();

    return {
      ids: data!.people.edges.map(({ node }) => node.id),
      totalCount: data!.people.totalCount,
    };
  };

  const waitForPeopleSeenBy = (token: string, isReady: (ids: string[]) => boolean) =>
    waitFor(async () => {
      const { ids } = await peopleSeenBy(token);

      return isReady(ids) ? ids : undefined;
    });

  const recompute = async (referenceDate?: Date) => {
    const { data } = await postRoute({
      path: '/proopco/recompute-visibility',
      headers: { [PROOPCO_SYNC_TOKEN_HEADER]: TEST_SYNC_TOKEN },
      body: referenceDate ? { referenceDate: referenceDate.toISOString() } : {},
    });

    expect(data.success).toBe(true);
  };

  const findFieldId = async (name: string) => {
    let after: string | null = null;

    for (;;) {
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
      const found = page.fields.edges.find(
        ({ node }) => node.name === name && node.objectMetadataId === personObjectId,
      );

      if (found) {
        return found.node.id;
      }

      if (!page.fields.pageInfo.hasNextPage) {
        throw new Error(`Person field ${name} not found`);
      }

      after = page.fields.pageInfo.endCursor;
    }
  };

  const createSegmentView = async (filters: { field: string; operand: string; value: string }[]) => {
    const { createView } = await metadataRequest<{ createView: { id: string } }>(
      `mutation ($input: CreateViewInput!) { createView(input: $input) { id } }`,
      { input: { name: uniqueId('segment'), objectMetadataId: personObjectId, icon: 'IconUsers' } },
    );

    for (const { field, operand, value } of filters) {
      const fieldMetadataId = await findFieldId(field);

      await metadataRequest(
        `mutation ($input: CreateViewFilterInput!) { createViewFilter(input: $input) { id } }`,
        {
          input: {
            viewId: createView.id,
            fieldMetadataId,
            operand,
            value,
          },
        },
      );
    }

    return createView.id;
  };

  const createCampaign = (segmentViewId: string, data: Record<string, unknown> = {}) =>
    create('Campaign', {
      name: uniqueId('campaign'),
      segmentViewId,
      startsAt: new Date(Date.now() - DAY_MS).toISOString(),
      status: 'ACTIVE',
      ...data,
    });

  // Later tests must not see this campaign's users through it.
  const endCampaign = async (campaignId: string) => {
    await mutate({
      updateCampaign: { __args: { id: campaignId, data: { status: 'ENDED' } }, id: true },
    });
    await recompute();
  };

  const assign = (campaignId: string, adminId: string) =>
    create('CampaignAdmin', { campaignId, adminId });

  beforeAll(async () => {
    const assigned = await assignSeededRoles([
      { email: SEEDED_AGENT_EMAIL, roleLabel: 'Sales Admin' },
      { email: SEEDED_OTHER_AGENT_EMAIL, roleLabel: 'Sales Admin' },
      { email: SEEDED_MANAGER_EMAIL, roleLabel: 'Supervisor' },
    ]);

    restoreRoles = assigned.restore;
    agentId = assigned.memberIds[SEEDED_AGENT_EMAIL];
    otherAgentId = assigned.memberIds[SEEDED_OTHER_AGENT_EMAIL];
    [agentToken, otherAgentToken, supervisorToken] = await Promise.all([
      signIn(SEEDED_AGENT_EMAIL),
      signIn(SEEDED_OTHER_AGENT_EMAIL),
      signIn(SEEDED_MANAGER_EMAIL),
    ]);

    const { objects } = await metadataRequest<{
      objects: { edges: { node: { id: string; nameSingular: string } }[] };
    }>(`{ objects(paging: { first: 200 }) { edges { node { id nameSingular } } } }`);

    personObjectId = objects.edges.find(({ node }) => node.nameSingular === 'person')!.node.id;
  });

  afterAll(async () => {
    await restoreRoles?.();

    for (const { singular, id } of [...created].reverse()) {
      await mutate({ [`destroy${singular}`]: { __args: { id }, id: true } }).catch(() => undefined);
    }
  });

  describe('objects no row rule can scope', () => {
    it.each(['challengeAccounts', 'payments', 'offerActivations', 'callFeedbackReasons'])(
      'denies a Sales Admin any %s row',
      async (collection) => {
        const { data, errors } = await userRequest<Record<string, Connection>>({
          token: agentToken,
          query: `{ ${collection}(first: 1) { totalCount edges { node { id } } } }`,
        });

        expect(errors !== undefined || data?.[collection]?.edges.length === 0).toBe(true);
      },
    );
  });

  describe('row-level predicate', () => {
    let listedId: string;
    let ownedId: string;
    let outsideId: string;
    let otherAdminsId: string;

    beforeAll(async () => {
      listedId = await createPerson('listed', { visibleToMemberIds: [agentId] });
      ownedId = await createPerson('owned', { currentOwnerId: agentId });
      outsideId = await createPerson('outside');
      otherAdminsId = await createPerson('other', { visibleToMemberIds: [otherAgentId] });
    });

    it('lists only users whose list contains the admin or that the admin owns, and counts only those', async () => {
      const { ids, totalCount } = await peopleSeenBy(agentToken);

      expect(ids.sort()).toEqual([listedId, ownedId].sort());
      expect(totalCount).toBe(2);
    });

    it('returns nothing when searching a user outside the scope (S2)', async () => {
      const search = async (token: string, term: string) => {
        const { data, errors } = await userRequest<{
          search: { edges: { node: { recordId: string } }[] };
        }>({
          token,
          query: `query ($term: String!) {
            search(searchInput: $term, limit: 20, includedObjectNameSingulars: ["person"]) {
              edges { node { recordId } }
            }
          }`,
          variables: { term },
        });

        expect(errors).toBeUndefined();

        return data!.search.edges.map(({ node }) => node.recordId);
      };

      expect(await search(agentToken, `${tag}-outside`)).toEqual([]);
      expect(await search(agentToken, `${tag}-other`)).toEqual([]);
      expect(await search(agentToken, `${tag}-listed`)).toEqual([listedId]);
      expect(await search(supervisorToken, `${tag}-outside`)).toEqual([outsideId]);
    });

    it('lets a Supervisor read every user', async () => {
      expect((await peopleSeenBy(supervisorToken)).ids.sort()).toEqual(
        [listedId, ownedId, outsideId, otherAdminsId].sort(),
      );
    });

    it('refuses an update of a user outside the scope', async () => {
      const update = await userRequest({
        token: agentToken,
        query: `mutation ($id: UUID!) { updatePerson(id: $id, data: { kycStatus: "tampered" }) { id } }`,
        variables: { id: outsideId },
      });

      expect(update.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('campaign lifecycle', () => {
    let firstId: string;
    let secondId: string;

    beforeAll(async () => {
      firstId = await createPerson('first');
      secondId = await createPerson('second');
    });

    it('lets a Supervisor create a campaign and assign admins (AS1)', async () => {
      const segmentViewId = await createSegmentView([
        { field: 'kycStatus', operand: 'CONTAINS', value: `${tag}` },
      ]);
      const { data, errors } = await userRequest<{ createCampaign: { id: string } }>({
        token: supervisorToken,
        query: `mutation ($data: CampaignCreateInput!) { createCampaign(data: $data) { id } }`,
        variables: {
          data: {
            name: uniqueId('supervisor-campaign'),
            segmentViewId,
            startsAt: new Date(Date.now() - DAY_MS).toISOString(),
            status: 'ENDED',
          },
        },
      });

      expect(errors).toBeUndefined();
      created.push({ singular: 'Campaign', id: data!.createCampaign.id });

      const assignment = await userRequest<{ createCampaignAdmin: { id: string } }>({
        token: supervisorToken,
        query: `mutation ($data: CampaignAdminCreateInput!) { createCampaignAdmin(data: $data) { id } }`,
        variables: { data: { campaignId: data!.createCampaign.id, adminId: agentId } },
      });

      expect(assignment.errors).toBeUndefined();
      created.push({ singular: 'CampaignAdmin', id: assignment.data!.createCampaignAdmin.id });
    });

    it('shows the unowned users to every assigned admin, hides owned ones, and drops them when the admin is removed or the campaign ends (S9)', async () => {
      const campaignId = await createCampaign(
        await createSegmentView([{ field: 'kycStatus', operand: 'CONTAINS', value: tag }]),
      );
      const agentAssignmentId = await assign(campaignId, agentId);

      await assign(campaignId, otherAgentId);

      // The database events recompute without anyone calling the job.
      await waitForPeopleSeenBy(agentToken, (ids) => ids.includes(firstId) && ids.includes(secondId));
      expect((await peopleSeenBy(otherAgentToken)).ids).toEqual(
        expect.arrayContaining([firstId, secondId]),
      );

      await mutate({
        updatePerson: { __args: { id: secondId, data: { currentOwnerId: agentId } }, id: true },
      });
      await recompute();

      expect((await peopleSeenBy(otherAgentToken)).ids).not.toContain(secondId);
      expect((await peopleSeenBy(agentToken)).ids).toContain(secondId);

      await mutate({
        updateCampaignAdmin: {
          __args: { id: agentAssignmentId, data: { removedAt: new Date().toISOString() } },
          id: true,
        },
      });

      // The owned user stays with its owner; the unowned one leaves the list.
      const afterRemoval = await waitForPeopleSeenBy(agentToken, (ids) => !ids.includes(firstId));

      expect(afterRemoval).toContain(secondId);
      expect((await peopleSeenBy(otherAgentToken)).ids).toContain(firstId);

      await mutate({
        updateCampaign: { __args: { id: campaignId, data: { status: 'ENDED' } }, id: true },
      });
      await waitForPeopleSeenBy(otherAgentToken, (ids) => !ids.includes(firstId));
    });

    it('keeps cooling down and permanently failed users out of every list', async () => {
      const coolingId = await createPerson('cooling', {
        cooldownUntil: new Date(Date.now() + DAY_MS).toISOString(),
      });
      const failedId = await createPerson('failed', {
        permanentlyFailedAt: new Date().toISOString(),
      });
      const campaignId = await createCampaign(
        await createSegmentView([{ field: 'kycStatus', operand: 'CONTAINS', value: tag }]),
      );

      await assign(campaignId, agentId);
      await recompute();

      const { ids } = await peopleSeenBy(agentToken);

      expect(ids).not.toContain(coolingId);
      expect(ids).not.toContain(failedId);

      // The cooldown ends: the same user is listed at a later reference date.
      await recompute(new Date(Date.now() + 2 * DAY_MS));
      expect((await peopleSeenBy(agentToken)).ids).toContain(coolingId);
      await endCampaign(campaignId);
    });

    it('adds a user that starts matching a relative-date segment (within the hourly recompute)', async () => {
      const upcomingId = await createPerson('upcoming', {
        lastLoginAt: new Date(Date.now() + 10 * DAY_MS).toISOString(),
      });
      const campaignId = await createCampaign(
        await createSegmentView([
          { field: 'kycStatus', operand: 'CONTAINS', value: tag },
          { field: 'lastLoginAt', operand: 'IS_RELATIVE', value: 'NEXT_7_DAY' },
        ]),
      );

      await assign(campaignId, agentId);
      await recompute();
      expect((await peopleSeenBy(agentToken)).ids).not.toContain(upcomingId);

      // Five days later the user falls inside the next 7 days.
      await recompute(new Date(Date.now() + 5 * DAY_MS));
      expect((await peopleSeenBy(agentToken)).ids).toContain(upcomingId);
      await endCampaign(campaignId);
    });

    it('lists a user right after a sync creates them', async () => {
      const campaignId = await createCampaign(
        await createSegmentView([{ field: 'kycStatus', operand: 'CONTAINS', value: tag }]),
      );

      await assign(campaignId, agentId);
      await recompute();

      const { data } = await postRoute({
        path: '/proopco/sync',
        headers: { [PROOPCO_SYNC_TOKEN_HEADER]: TEST_SYNC_TOKEN },
        body: {
          items: [
            {
              type: 'user',
              proopcoId: uniqueId('synced'),
              data: { firstName: 'Synced', email: `${uniqueId('synced')}@example.com`, kycStatus: tag },
            },
          ],
        },
      });
      const { people } = await query({
        people: {
          __args: { filter: { proopcoId: { eq: data.results[0].proopcoId } } },
          edges: { node: { id: true } },
        },
      });
      const syncedId = people.edges[0].node.id as string;

      created.push({ singular: 'Person', id: syncedId });
      expect(data.results[0].status).toBe('created');
      expect((await peopleSeenBy(agentToken)).ids).toContain(syncedId);
      await endCampaign(campaignId);
    });

    it('reports the available count on the campaign', async () => {
      const campaignId = await createCampaign(
        await createSegmentView([{ field: 'kycStatus', operand: 'CONTAINS', value: tag }]),
      );

      await recompute();

      const { campaign } = await query({
        campaign: { __args: { filter: { id: { eq: campaignId } } }, availableUserCount: true },
      });

      expect(Number(campaign.availableUserCount)).toBeGreaterThanOrEqual(2);
    });

    it('shows a Sales Admin only their own campaign assignments', async () => {
      const { data, errors } = await userRequest<{
        campaignAdmins: { edges: { node: { adminId: string } }[] };
      }>({
        token: agentToken,
        query: `{ campaignAdmins(first: 200) { edges { node { adminId } } } }`,
      });

      expect(errors).toBeUndefined();
      expect(new Set(data!.campaignAdmins.edges.map(({ node }) => node.adminId))).toEqual(
        new Set([agentId]),
      );
    });
  });
});
