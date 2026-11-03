import { randomUUID } from 'crypto';

import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { describe, expect, it } from 'vitest';

import { metadataRequest } from './metadata-request';
import { readManifestLogicFunctionNamesOrThrow } from './read-manifest-logic-function-names-or-throw';
import {
  TEST_CALLBACK_TOKEN,
  TEST_ENQUEUE_TOKEN,
  TEST_RATE_PER_MINUTE,
} from './test-constants';

const core = new CoreApiClient();
const runId = Date.now().toString(36);
const ref = (name: string) => `${name}-${runId}-${randomUUID().slice(0, 8)}`;

const phone = () => `+447${Math.random().toString().slice(2, 12)}`;

type Loose = Record<string, any>;

const post = async (
  path: string,
  headers: Record<string, string>,
  body: unknown,
) => {
  const response = await fetch(`${process.env.TWENTY_API_URL}/s${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

  return (await response.json()) as Loose;
};

const enqueue = (
  messages: unknown[],
  token: string | null = TEST_ENQUEUE_TOKEN,
) =>
  post('/sms/enqueue', token === null ? {} : { 'x-sms-enqueue-token': token }, {
    messages,
  });
const send = () =>
  post('/sms/send', { 'x-sms-enqueue-token': TEST_ENQUEUE_TOKEN }, {});
const deliver = (body: unknown, token = TEST_CALLBACK_TOKEN) =>
  post('/sms/delivery', { 'x-sms-callback-token': token }, body);

const findMessage = async (sourceRef: string): Promise<Loose[]> => {
  const { smsMessages } = (await core.query({
    smsMessages: {
      __args: { filter: { sourceRef: { eq: sourceRef } } },
      edges: {
        node: {
          id: true,
          to: true,
          status: true,
          providerMessageId: true,
          error: true,
          sentAt: true,
          deliveredAt: true,
        },
      },
    },
  } as never)) as Loose;

  return smsMessages.edges.map(({ node }: Loose) => node);
};

const countByStatus = async (status: string): Promise<number> => {
  const { smsMessages } = (await core.query({
    smsMessages: {
      __args: { filter: { status: { eq: status } } },
      totalCount: true,
    },
  } as never)) as Loose;

  return smsMessages.totalCount;
};

const drainQueue = async () => {
  while ((await countByStatus('QUEUED')) > 0) {
    await send();
  }
};

describe('twenty-sms', () => {
  it('deploys every logic function the manifest declares', async () => {
    const { findManyLogicFunctions } = await new MetadataApiClient().query({
      findManyLogicFunctions: { name: true },
    });
    const deployedNames = findManyLogicFunctions.map(
      (logicFunction: { name: string }) => logicFunction.name,
    );

    for (const name of await readManifestLogicFunctionNamesOrThrow()) {
      expect(deployedNames).toContain(name);
    }
  });

  it('installs SMS Message and SMS Opt-out', async () => {
    const data = await metadataRequest<{
      objects: { edges: { node: { nameSingular: string } }[] };
    }>(
      `{ objects(paging: { first: 200 }) { edges { node { nameSingular } } } }`,
    );
    const names = data.objects.edges.map(({ node }) => node.nameSingular);

    expect(names).toEqual(expect.arrayContaining(['smsMessage', 'smsOptOut']));
  });

  it.each([[null], ['wrong-token']])(
    'rejects enqueue with token %s',
    async (token) => {
      expect(
        await enqueue(
          [{ to: phone(), body: 'Hi', sourceRef: ref('r') }],
          token,
        ),
      ).toEqual({
        success: false,
        error: 'Invalid enqueue token',
      });
    },
  );

  it('marks invalid numbers invalid and queues valid ones', async () => {
    const valid = ref('valid');
    const invalid = ref('invalid');
    const response = await enqueue([
      { to: phone(), body: 'Hi', sourceRef: valid },
      { to: '12345', body: 'Hi', sourceRef: invalid },
    ]);

    expect(response.results).toEqual([
      { sourceRef: valid, status: 'queued' },
      { sourceRef: invalid, status: 'invalid' },
    ]);
  });

  it('skips opted-out numbers, whatever their formatting', async () => {
    const optedOut = phone();
    const sourceRef = ref('optout');

    await core.mutation({
      createSmsOptOut: {
        __args: { data: { phone: optedOut, reason: 'test' } },
        id: true,
      },
    } as never);

    const response = await enqueue([
      {
        to: `${optedOut.slice(0, 3)} ${optedOut.slice(3)}`,
        body: 'Hi',
        sourceRef,
      },
    ]);

    expect(response.results).toEqual([
      { sourceRef, status: 'skipped_opt_out' },
    ]);
    expect((await findMessage(sourceRef))[0].status).toBe('SKIPPED_OPT_OUT');
  });

  it('treats sourceRef as unique, within and across requests', async () => {
    const sourceRef = ref('dedup');
    const message = { to: phone(), body: 'Hi', sourceRef };
    const first = await enqueue([message, message]);
    const second = await enqueue([message]);

    expect(first.results).toEqual([
      { sourceRef, status: 'queued' },
      { sourceRef, status: 'queued' },
    ]);
    expect(second.results).toEqual([{ sourceRef, status: 'queued' }]);
    expect(await findMessage(sourceRef)).toHaveLength(1);
  });

  it('sends at most RATE_PER_MINUTE messages per run and records sent', async () => {
    await drainQueue();

    const sourceRefs = Array.from({ length: TEST_RATE_PER_MINUTE + 2 }, () =>
      ref('rate'),
    );

    await enqueue(
      sourceRefs.map((sourceRef) => ({ to: phone(), body: 'Hi', sourceRef })),
    );

    const run = await send();

    expect(run).toMatchObject({
      success: true,
      sent: TEST_RATE_PER_MINUTE,
      failed: 0,
    });
    expect(await countByStatus('QUEUED')).toBe(2);

    const sent = (await Promise.all(sourceRefs.map(findMessage)))
      .flat()
      .filter(({ status }) => status === 'SENT');

    expect(sent).toHaveLength(TEST_RATE_PER_MINUTE);
    expect(sent[0].providerMessageId).toMatch(/^fake-/);
    expect(sent[0].sentAt).toBeTruthy();

    await drainQueue();
  });

  it('rejects a send run without the token', async () => {
    expect(await post('/sms/send', {}, {})).toEqual({
      success: false,
      error: 'Invalid enqueue token',
    });
  });

  it('updates status from delivery reports and rejects bad ones', async () => {
    await drainQueue();

    const [deliveredRef, failedRef] = [ref('delivered'), ref('failed')];

    await enqueue([
      { to: phone(), body: 'Hi', sourceRef: deliveredRef },
      { to: phone(), body: 'Hi', sourceRef: failedRef },
    ]);
    await send();

    const [delivered] = await findMessage(deliveredRef);
    const [failed] = await findMessage(failedRef);

    expect(
      await deliver(
        { providerMessageId: delivered.providerMessageId, status: 'delivered' },
        'nope',
      ),
    ).toEqual({ success: false, error: 'Invalid callback token' });
    expect(
      await deliver({
        providerMessageId: delivered.providerMessageId,
        status: 'delivered',
      }),
    ).toEqual({ success: true });
    expect(
      await deliver({
        providerMessageId: failed.providerMessageId,
        status: 'failed',
        error: 'Carrier rejected',
      }),
    ).toEqual({ success: true });
    expect(
      await deliver({ providerMessageId: 'unknown', status: 'delivered' }),
    ).toMatchObject({
      success: false,
    });

    expect((await findMessage(deliveredRef))[0]).toMatchObject({
      status: 'DELIVERED',
    });
    expect((await findMessage(deliveredRef))[0].deliveredAt).toBeTruthy();
    expect((await findMessage(failedRef))[0]).toMatchObject({
      status: 'FAILED',
      error: 'Carrier rejected',
    });
  });
});
