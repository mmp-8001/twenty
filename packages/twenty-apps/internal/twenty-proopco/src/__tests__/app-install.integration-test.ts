import { describe, expect, it } from 'vitest';

import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { metadataRequest } from './metadata-request';
import { runDeployedPostInstall } from './seeded-sessions';

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

  it('leaves no #34 entities behind', async () => {
    const { objects } = await loadMetadata();
    const names = objects.map((object) => object.nameSingular);

    for (const removed of [
      'tradingAccount',
      'followupType',
      'commissionTier',
    ]) {
      expect(names).not.toContain(removed);
    }
  });

  it('creates the User fields on Person', async () => {
    const { fieldNamesOf } = await loadMetadata();
    const personFields = fieldNamesOf('person');

    expect(personFields).toEqual(
      expect.arrayContaining([
        'proopcoId',
        'signedUpAt',
        'kycStatus',
        'lastLoginAt',
        'birthday',
        'isReferral',
        'hasProfitWithdrawal',
        'purchaseCount',
        'totalPaidUsdt',
        'lastPurchaseAt',
        'activeAccountCount',
        'currentStage',
        'challengeAccounts',
        'payments',
      ]),
    );
    expect(personFields).not.toContain('isVip');
  });

  it('creates the Challenge Account and Payment objects', async () => {
    const { fieldNamesOf } = await loadMetadata();

    expect(fieldNamesOf('challengeAccount')).toEqual(
      expect.arrayContaining(['proopcoId', 'status', 'phase', 'failureReason', 'person', 'payments']),
    );
    expect(fieldNamesOf('payment')).toEqual(
      expect.arrayContaining([
        'proopcoId',
        'amountToman',
        'amountUsdt',
        'paidAt',
        'person',
        'challengeAccount',
      ]),
    );
    expect(fieldNamesOf('payment')).not.toContain('kind');
  });

  it('gives workspace members a CRM status and frozen since', async () => {
    const { fields, fieldNamesOf } = await loadMetadata();
    const crmStatus = fields.find(
      (field) => field.name === 'crmStatus' && field.type === 'SELECT',
    );

    expect(fieldNamesOf('workspaceMember')).toEqual(
      expect.arrayContaining(['crmStatus', 'frozenSince']),
    );
    expect(crmStatus?.options?.map((option) => option.value)).toEqual([
      'ACTIVE',
      'FROZEN',
      'DEACTIVATED',
    ]);
  });

  it('adds the three assignable roles and keeps synced data read-only for each', async () => {
    const { objects } = await loadMetadata();
    const { getRoles } = await metadataRequest<{
      getRoles: {
        label: string;
        canBeAssignedToUsers: boolean;
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
        label canBeAssignedToUsers
        objectPermissions {
          objectMetadataId canReadObjectRecords canUpdateObjectRecords
          canSoftDeleteObjectRecords canDestroyObjectRecords
        }
      }
    }`);

    for (const label of ['Sales Admin', 'Supervisor', 'Full Admin']) {
      const role = getRoles.find((candidate) => candidate.label === label);

      expect(role?.canBeAssignedToUsers).toBe(true);

      for (const nameSingular of ['person', 'challengeAccount', 'payment']) {
        const objectId = objects.find(
          (object) => object.nameSingular === nameSingular,
        )?.id;

        expect(
          role?.objectPermissions.find(
            (permission) => permission.objectMetadataId === objectId,
          ),
        ).toMatchObject({
          // A Sales Admin reads accounts and payments only through routes that check the User's scope.
          canReadObjectRecords: !(label === 'Sales Admin' && nameSingular !== 'person'),
          canUpdateObjectRecords: false,
          canSoftDeleteObjectRecords: false,
          canDestroyObjectRecords: false,
        });
      }
    }

    expect(getRoles.map(({ label }) => label)).not.toContain('Sales Agent');
    expect(getRoles.map(({ label }) => label)).not.toContain('Sales Manager');
  });

  it('deactivates Opportunity without deleting navigation items', async () => {
    await runDeployedPostInstall();

    const { objects } = await loadMetadata();

    expect(
      objects.find((object) => object.nameSingular === 'opportunity')?.isActive,
    ).toBe(false);
  });
});
