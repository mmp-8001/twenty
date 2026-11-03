import { describe, expect, it } from 'vitest';

import { CoreApiClient } from 'twenty-client-sdk/core';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { metadataRequest } from './metadata-request';
import { createFollowup, createTrader, getFollowup, mutate } from './sales-core-helpers';
import { runDeployedPostInstall } from './seeded-sessions';

type NamedNode = { id: string; nameSingular?: string; name?: string };

const FIELD_PAGE_SIZE = 500;

type FieldNode = {
  name: string;
  type: string;
  options: { value: string }[] | null;
  objectMetadataId: string;
};

// The workspace holds more than one page of fields.
const loadAllFields = async (): Promise<FieldNode[]> => {
  const fields: FieldNode[] = [];
  let after: string | null = null;

  for (;;) {
    const data: {
      fields: {
        edges: { node: FieldNode }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } = await metadataRequest(
      `query ($after: ConnectionCursor) {
        fields(paging: { first: ${FIELD_PAGE_SIZE}, after: $after }) {
          edges { node { name type options objectMetadataId } }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { after },
    );

    fields.push(...data.fields.edges.map(({ node }) => node));

    if (!data.fields.pageInfo.hasNextPage) {
      return fields;
    }

    after = data.fields.pageInfo.endCursor;
  }
};

const loadMetadata = async () => {
  const data = await metadataRequest<{
    objects: { edges: { node: { id: string; nameSingular: string; isActive: boolean } }[] };
  }>(`{ objects(paging: { first: 200 }) { edges { node { id nameSingular isActive } } } }`);
  const objects = data.objects.edges.map(({ node }) => node);
  const fields = await loadAllFields();
  const fieldNamesOf = (nameSingular: string) => {
    const objectId = objects.find(
      (object) => object.nameSingular === nameSingular,
    )?.id;

    return fields
      .filter((field) => field.objectMetadataId === objectId)
      .map((field) => field.name);
  };

  return { objects, fields, fieldNamesOf };
};

describe('twenty-proopco install', () => {
  it('needs neither the SMS app nor a proopco connection to be configured', async () => {
    const { findApplicationRegistrationByUniversalIdentifier: registration } =
      await metadataRequest<{
        findApplicationRegistrationByUniversalIdentifier: {
          id: string;
          isConfigured: boolean;
        };
      }>(
        `query ($universalIdentifier: String!) {
          findApplicationRegistrationByUniversalIdentifier(universalIdentifier: $universalIdentifier) { id isConfigured }
        }`,
        { universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER },
      );
    const { findApplicationRegistrationVariables: variables } =
      await metadataRequest<{
        findApplicationRegistrationVariables: { key: string; isRequired: boolean }[];
      }>(
        `query ($id: String!) {
          findApplicationRegistrationVariables(applicationRegistrationId: $id) { key isRequired }
        }`,
        { id: registration.id },
      );

    expect(registration.isConfigured).toBe(true);
    expect(
      variables.filter((variable) => variable.isRequired).map(({ key }) => key),
    ).toEqual([]);
  });

  it('creates the Person trading fields', async () => {
    const { fieldNamesOf } = await loadMetadata();

    expect(fieldNamesOf('person')).toEqual(
      expect.arrayContaining([
        'proopcoId',
        'purchaseCount',
        'totalSpent',
        'lastPurchaseAt',
        'isVip',
        'source',
        'labels',
        'referredBy',
        'referrals',
        'tradingAccounts',
        'payments',
      ]),
    );
  });

  it('creates the Trading Account object', async () => {
    const { fieldNamesOf } = await loadMetadata();

    expect(fieldNamesOf('tradingAccount')).toEqual(
      expect.arrayContaining([
        'proopcoId',
        'status',
        'failureReason',
        'phase',
        'trader',
        'payments',
      ]),
    );
  });

  it('creates the Payment object with exactly three kinds', async () => {
    const { fields, fieldNamesOf } = await loadMetadata();
    const kind = fields.find(
      (field) => field.name === 'kind' && field.type === 'SELECT',
    );

    expect(fieldNamesOf('payment')).toEqual(
      expect.arrayContaining([
        'proopcoId',
        'amount',
        'kind',
        'paidAt',
        'trader',
        'tradingAccount',
      ]),
    );
    expect(kind?.options?.map((option) => option.value)).toEqual([
      'PURCHASE',
      'INSTALLMENT_INITIAL',
      'INSTALLMENT_REMAINING',
    ]);
  });

  it('gives the Sales Agent read-only access to synced facts', async () => {
    const { objects } = await loadMetadata();
    const { getRoles } = await metadataRequest<{
      getRoles: {
        label: string;
        objectPermissions: {
          objectMetadataId: string;
          canReadObjectRecords: boolean;
          canUpdateObjectRecords: boolean;
          canSoftDeleteObjectRecords: boolean;
          canDestroyObjectRecords: boolean;
        }[];
      }[];
    }>(`{
      getRoles {
        label
        objectPermissions {
          objectMetadataId canReadObjectRecords canUpdateObjectRecords
          canSoftDeleteObjectRecords canDestroyObjectRecords
        }
      }
    }`);
    const salesAgent = getRoles.find((role) => role.label === 'Sales Agent');

    expect(salesAgent).toBeDefined();

    for (const nameSingular of ['tradingAccount', 'payment']) {
      const objectId = objects.find(
        (object: Pick<NamedNode, 'id' | 'nameSingular'>) =>
          object.nameSingular === nameSingular,
      )?.id;
      const permission = salesAgent?.objectPermissions.find(
        (objectPermission) => objectPermission.objectMetadataId === objectId,
      );

      expect(permission).toMatchObject({
        canReadObjectRecords: true,
        canUpdateObjectRecords: false,
        canSoftDeleteObjectRecords: false,
        canDestroyObjectRecords: false,
      });
    }
  });

  it('creates the sales objects', async () => {
    const { fieldNamesOf } = await loadMetadata();

    expect(fieldNamesOf('followup')).toEqual(
      expect.arrayContaining([
        'stage',
        'expiresAt',
        'retryExpiresAt',
        'failureReason',
        'followupType',
        'trader',
        'owner',
        'commissions',
      ]),
    );
    expect(fieldNamesOf('followupType')).toEqual(
      expect.arrayContaining(['name', 'expiryDays', 'commissionable']),
    );
    expect(fieldNamesOf('commissionTier')).toEqual(
      expect.arrayContaining(['name', 'minDay', 'maxDay', 'rate']),
    );
    expect(fieldNamesOf('commission')).toEqual(
      expect.arrayContaining([
        'payment',
        'followup',
        'owner',
        'amount',
        'rateApplied',
        'tierName',
        'basis',
        'scope',
        'monthlyIncome',
      ]),
    );
    expect(fieldNamesOf('monthlyIncome')).toEqual(
      expect.arrayContaining(['agent', 'month', 'total', 'payoutStatus', 'commissions']),
    );
  });

  it('gives Followup the five stages and Task an activity type', async () => {
    const { fields, fieldNamesOf } = await loadMetadata();
    const stage = fields.find(
      (field) => field.name === 'stage' && field.type === 'SELECT',
    );
    const activityType = fields.find((field) => field.name === 'activityType');

    expect(stage?.options?.map((option) => option.value)).toEqual([
      'PENDING',
      'RETRY_PENDING',
      'SUCCEEDED',
      'FAILED',
      'EXPIRED',
    ]);
    expect(activityType?.options?.map((option) => option.value)).toEqual([
      'CALL',
      'SMS',
      'EMAIL',
      'MEETING',
      'OTHER',
    ]);
    expect(fieldNamesOf('task')).toContain('activityType');
  });

  it('builds the Followups kanban with one group per stage and the Activities board', async () => {
    const { views } = await metadataRequest<{
      views: { id: string; name: string; type: string }[];
    }>('{ views: getViews { id name type } }');
    const followups = views.find((view) => view.name === 'Followups');
    const activities = views.find((view) => view.name === 'Activities');

    expect(followups?.type).toBe('KANBAN');
    expect(activities?.type).toBe('KANBAN');

    for (const [view, expected] of [
      [followups, 5],
      [activities, 3],
    ] as const) {
      const { groups } = await metadataRequest<{ groups: { fieldValue: string }[] }>(
        'query ($viewId: String) { groups: getViewGroups(viewId: $viewId) { fieldValue } }',
        { viewId: view?.id },
      );

      expect(groups).toHaveLength(expected);
    }
  });

  it('seeds default Followup Types and Commission Tiers', async () => {
    const { followupTypes, commissionTiers } = await new CoreApiClient().query({
      followupTypes: { totalCount: true },
      commissionTiers: { totalCount: true },
    });

    expect(followupTypes?.totalCount).toBeGreaterThan(0);
    expect(commissionTiers?.totalCount).toBeGreaterThan(0);
  });

  it('keeps a manager edit when the seed runs again', async () => {
    const client = new CoreApiClient();
    const { commissionTiers } = await client.query({
      commissionTiers: {
        __args: { first: 1 },
        edges: { node: { id: true, name: true } },
      },
    });
    const tier = commissionTiers?.edges?.[0]?.node;
    const updateName = (name: string) =>
      client.mutation({
        updateCommissionTier: { __args: { id: tier!.id, data: { name } }, id: true },
      });

    await updateName('Edited by a manager');
    await runDeployedPostInstall();

    const { commissionTier } = await client.query({
      commissionTier: { __args: { filter: { id: { eq: tier!.id } } }, name: true },
    });

    // Later suites read the seeded tier names.
    await updateName(String(tier!.name));

    expect(commissionTier?.name).toBe('Edited by a manager');
  });

  it('backfills the active-trader key of keyless active Followups and skips a conflict', async () => {
    const firstTraderId = await createTrader('backfill-a');
    const secondTraderId = await createTrader('backfill-b');
    const pendingId = await createFollowup({ traderId: firstTraderId });
    const retryId = await createFollowup({
      traderId: secondTraderId,
      stage: 'RETRY_PENDING',
    });
    const duplicateIds = [
      await createFollowup({ traderId: secondTraderId }),
      await createFollowup({ traderId: secondTraderId }),
    ];
    const succeededId = await createFollowup({
      traderId: firstTraderId,
      stage: 'SUCCEEDED',
    });
    const keyOf = async (id: string) =>
      (await getFollowup(id, { activeTraderKey: true })).activeTraderKey;

    expect(await keyOf(pendingId)).toBeFalsy();

    await runDeployedPostInstall();

    expect(await keyOf(pendingId)).toBe(firstTraderId);
    expect(await keyOf(succeededId)).toBeFalsy();

    const keys = await Promise.all([retryId, ...duplicateIds].map(keyOf));

    expect(keys.filter((key) => key === secondTraderId)).toHaveLength(1);

    for (const id of [pendingId, retryId, succeededId, ...duplicateIds]) {
      await mutate({ destroyFollowup: { __args: { id }, id: true } });
    }
  });

  it('deactivates Opportunity without deleting navigation items', async () => {
    const { objects } = await loadMetadata();

    expect(
      objects.find((object) => object.nameSingular === 'opportunity')?.isActive,
    ).toBe(false);
  });

  it('configures the Sales Agent and Sales Manager roles', async () => {
    const { objects } = await loadMetadata();
    const { getRoles } = await metadataRequest<{
      getRoles: {
        label: string;
        canReadAllObjectRecords: boolean;
        canUpdateAllObjectRecords: boolean;
        objectPermissions: {
          objectMetadataId: string;
          canReadObjectRecords: boolean;
          canUpdateObjectRecords: boolean;
        }[];
      }[];
    }>(`{
      getRoles {
        label canReadAllObjectRecords canUpdateAllObjectRecords
        objectPermissions { objectMetadataId canReadObjectRecords canUpdateObjectRecords }
      }
    }`);
    const agent = getRoles.find((role) => role.label === 'Sales Agent');
    const manager = getRoles.find((role) => role.label === 'Sales Manager');
    const idOf = (nameSingular: string) =>
      objects.find((object) => object.nameSingular === nameSingular)?.id;
    const permissionOn = (nameSingular: string) =>
      agent?.objectPermissions.find(
        (permission) => permission.objectMetadataId === idOf(nameSingular),
      );

    for (const nameSingular of ['followupType', 'commissionTier']) {
      expect(permissionOn(nameSingular)).toMatchObject({
        canReadObjectRecords: true,
        canUpdateObjectRecords: false,
      });
    }

    expect(permissionOn('followup')).toMatchObject({ canUpdateObjectRecords: true });
    expect(permissionOn('commission')).toMatchObject({ canUpdateObjectRecords: true });

    expect(manager).toMatchObject({
      canReadAllObjectRecords: true,
      canUpdateAllObjectRecords: true,
    });
  });
});
