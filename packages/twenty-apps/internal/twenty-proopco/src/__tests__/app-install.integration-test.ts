import { describe, expect, it } from 'vitest';

import { metadataRequest } from './metadata-request';

type NamedNode = { id: string; nameSingular?: string; name?: string };

const loadMetadata = async () => {
  const data = await metadataRequest<{
    objects: { edges: { node: { id: string; nameSingular: string } }[] };
    fields: {
      edges: {
        node: {
          name: string;
          type: string;
          options: { value: string }[] | null;
          objectMetadataId: string;
        };
      }[];
    };
  }>(`{
    objects(paging: { first: 200 }) { edges { node { id nameSingular } } }
    fields(paging: { first: 1000 }) {
      edges { node { name type options objectMetadataId } }
    }
  }`);
  const objects = data.objects.edges.map(({ node }) => node);
  const fields = data.fields.edges.map(({ node }) => node);
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
      'purchase',
      'installment_initial',
      'installment_remaining',
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
});
