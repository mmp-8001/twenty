import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { SEND_CAMPAIGN_ROUTE_PATH } from 'src/constants/campaign.constant';

import { postRoute } from './post-sync-route';
import {
  mutate,
  query,
  setServerVariable,
  throttle,
  throttledMetadataRequest,
  uniqueId,
} from './sales-core-helpers';
import { startStubServer, type StubResponse } from './stub-server';

const ENQUEUE_TOKEN = 'campaign-test-enqueue-token';

let enqueueResponse: StubResponse = {
  status: 200,
  body: { success: true, results: [] },
};
type EnqueueBody = { messages: { to: string; body: string; sourceRef: string }[] };

let stub: Awaited<ReturnType<typeof startStubServer<EnqueueBody>>>;
let personObjectId: string;
const fieldIdByName = new Map<string, string>();

beforeAll(async () => {
  stub = await startStubServer<EnqueueBody>(() => enqueueResponse);
  await setServerVariable('SMS_ENQUEUE_URL', `${stub.url}/s/sms/enqueue`);
  await setServerVariable('SMS_ENQUEUE_TOKEN', ENQUEUE_TOKEN);

  const { objects } = await throttledMetadataRequest<{
    objects: { edges: { node: { id: string; nameSingular: string } }[] };
  }>(`{ objects(paging: { first: 200 }) { edges { node { id nameSingular } } } }`);

  personObjectId = objects.edges.find(
    ({ node }) => node.nameSingular === 'person',
  )!.node.id;

  const { fields } = await throttledMetadataRequest<{
    fields: { edges: { node: { id: string; name: string } }[] };
  }>(
    `query ($objectId: UUID!) {
      fields(filter: { objectMetadataId: { eq: $objectId } }, paging: { first: 200 }) {
        edges { node { id name } }
      }
    }`,
    { objectId: personObjectId },
  );

  for (const { node } of fields.edges) {
    fieldIdByName.set(node.name, node.id);
  }
});

afterAll(async () => {
  await stub.stop();
});

type ViewFilterInput = {
  field: string;
  operand: string;
  value: unknown;
  groupId?: string;
};

const createSegment = async (
  filters: ViewFilterInput[],
  groupOperator?: 'OR',
): Promise<string> => {
  const { createView } = await throttledMetadataRequest<{
    createView: { id: string };
  }>(
    `mutation ($input: CreateViewInput!) { createView(input: $input) { id } }`,
    {
      input: {
        name: uniqueId('Segment'),
        icon: 'IconUsers',
        objectMetadataId: personObjectId,
      },
    },
  );
  let groupId: string | undefined;

  if (groupOperator) {
    groupId = (
      await throttledMetadataRequest<{ createViewFilterGroup: { id: string } }>(
        `mutation ($input: CreateViewFilterGroupInput!) { createViewFilterGroup(input: $input) { id } }`,
        {
          input: {
            viewId: createView.id,
            logicalOperator: groupOperator,
          },
        },
      )
    ).createViewFilterGroup.id;
  }

  for (const filter of filters) {
    await throttledMetadataRequest(
      `mutation ($input: CreateViewFilterInput!) { createViewFilter(input: $input) { id } }`,
      {
        input: {
          viewId: createView.id,
          fieldMetadataId: fieldIdByName.get(filter.field),
          operand: filter.operand,
          value: filter.value,
          ...(groupId && { viewFilterGroupId: groupId }),
        },
      },
    );
  }

  return createView.id;
};

const createPerson = async (data: {
  source: string;
  purchaseCount?: number;
  phone?: string;
}): Promise<string> =>
  (
    await mutate({
      createPerson: {
        __args: {
          data: {
            name: { firstName: 'Camp' },
            source: data.source,
            purchaseCount: data.purchaseCount,
            ...(data.phone && {
              phones: {
                primaryPhoneNumber: data.phone,
                primaryPhoneCallingCode: '+44',
              },
            }),
          },
        },
        id: true,
      },
    })
  ).createPerson.id;

const createCampaign = async (segmentViewId: string): Promise<string> =>
  (
    await mutate({
      createCampaign: {
        __args: {
          data: { name: uniqueId('Campaign'), segmentViewId, message: 'Hello trader' },
        },
        id: true,
      },
    })
  ).createCampaign.id;

const getCampaign = async (id: string) =>
  (
    await query({
      campaign: {
        __args: { filter: { id: { eq: id } } },
        status: true,
        recipientCount: true,
        sentAt: true,
      },
    })
  ).campaign;

const send = async (campaignId: string) => {
  await throttle();

  return (
    await postRoute({
      path: SEND_CAMPAIGN_ROUTE_PATH,
      headers: { authorization: `Bearer ${process.env.TWENTY_API_KEY}` },
      body: { campaignId },
    })
  ).data as { success: boolean; error?: string; recipientCount?: number };
};

// Brackets keep one tag from being a substring of another under CONTAINS.
const tag = (name: string) => `<${uniqueId(name)}>`;

const sentMessages = () => stub.requests.flatMap(({ body }) => body.messages);

describe('Campaigns', () => {
  it('queues one SMS per Trader matching the Segment, once', async () => {
    const source = tag('segment-is');
    const matching = await createPerson({ source, purchaseCount: 3, phone: '7911123456' });

    await createPerson({ source, purchaseCount: 1, phone: '7911123457' });
    await createPerson({ source, purchaseCount: 5 });
    await createPerson({ source: tag('other'), purchaseCount: 9, phone: '7911123458' });

    const campaignId = await createCampaign(
      await createSegment([
        { field: 'source', operand: 'CONTAINS', value: source },
        { field: 'purchaseCount', operand: 'GREATER_THAN_OR_EQUAL', value: '2' },
      ]),
    );
    const before = stub.requests.length;

    expect(await send(campaignId)).toEqual({ success: true, recipientCount: 1 });
    expect(stub.requests).toHaveLength(before + 1);

    const request = stub.requests[before];

    expect(request.headers['x-sms-enqueue-token']).toBe(ENQUEUE_TOKEN);
    expect(request.body.messages).toEqual([
      {
        to: '+447911123456',
        body: 'Hello trader',
        sourceRef: `campaign:${campaignId}:person:${matching}`,
      },
    ]);

    const campaign = await getCampaign(campaignId);

    expect(campaign).toMatchObject({ status: 'SENT', recipientCount: 1 });
    expect(campaign.sentAt).toBeTruthy();

    // A double click, or a second manager, sends nothing more.
    expect(await send(campaignId)).toEqual({
      success: false,
      error: 'Campaign is already sending or sent',
    });
    expect(stub.requests).toHaveLength(before + 1);
  });

  it('resolves Segments with filter groups', async () => {
    const [first, second] = [tag('seg-or-a'), tag('seg-or-b')];
    const people = [
      await createPerson({ source: first, phone: '7911223341' }),
      await createPerson({ source: second, phone: '7911223342' }),
      await createPerson({ source: tag('seg-or-c'), phone: '7911223343' }),
    ];
    const campaignId = await createCampaign(
      await createSegment(
        [
          { field: 'source', operand: 'CONTAINS', value: first },
          { field: 'source', operand: 'CONTAINS', value: second },
        ],
        'OR',
      ),
    );
    const before = stub.requests.length;

    expect(await send(campaignId)).toMatchObject({ success: true, recipientCount: 2 });
    expect(
      stub.requests.slice(before).flatMap(({ body }) => body.messages.map((message) => message.sourceRef)).sort(),
    ).toEqual(
      [people[0], people[1]].map((id) => `campaign:${campaignId}:person:${id}`).sort(),
    );
  });

  it('reports zero recipients and sends nothing', async () => {
    const campaignId = await createCampaign(
      await createSegment([
        { field: 'source', operand: 'CONTAINS', value: tag('nobody') },
      ]),
    );
    const before = stub.requests.length;

    expect(await send(campaignId)).toEqual({
      success: false,
      error: 'No recipients match this segment',
    });
    expect(stub.requests).toHaveLength(before);
    expect((await getCampaign(campaignId)).status).toBe('DRAFT');
  });

  it('names an unsupported operand and stays a Draft', async () => {
    const campaignId = await createCampaign(
      await createSegment([
        { field: 'createdAt', operand: 'IS_RELATIVE', value: 'PAST_1_DAY' },
      ]),
    );
    const before = stub.requests.length;
    const result = await send(campaignId);

    expect(result.success).toBe(false);
    expect(result.error).toContain('IS_RELATIVE');
    expect(stub.requests).toHaveLength(before);
    expect((await getCampaign(campaignId)).status).toBe('DRAFT');
  });

  it('returns to Draft when the SMS app refuses, so a resend works', async () => {
    const source = tag('segment-retry');

    await createPerson({ source, phone: '7911333444' });

    const campaignId = await createCampaign(
      await createSegment([{ field: 'source', operand: 'CONTAINS', value: source }]),
    );

    enqueueResponse = { status: 401, body: { success: false, error: 'Invalid enqueue token' } };

    expect(await send(campaignId)).toEqual({
      success: false,
      error: 'SMS enqueue failed: Invalid enqueue token',
    });
    expect((await getCampaign(campaignId)).status).toBe('DRAFT');

    enqueueResponse = { status: 200, body: { success: true, results: [] } };

    expect(await send(campaignId)).toEqual({ success: true, recipientCount: 1 });
    // Both attempts carry the same sourceRef, which the SMS app dedups.
    const refs = sentMessages().map((message) => message.sourceRef);
    const campaignRefs = refs.filter((ref: string) => ref.startsWith(`campaign:${campaignId}:`));

    expect(new Set(campaignRefs).size).toBe(1);
  });
});
