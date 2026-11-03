import { afterAll, describe, expect, it } from 'vitest';

import { GIFT_DISCOUNT_ROUTE_PATH } from 'src/constants/campaign.constant';

import { postRoute } from './post-sync-route';
import {
  mutate,
  setServerVariable,
  throttle,
  uniqueId,
} from './sales-core-helpers';
import { startStubServer } from './stub-server';

const gift = async (body: Record<string, unknown>) => {
  await throttle();

  return (
    await postRoute({
      path: GIFT_DISCOUNT_ROUTE_PATH,
      headers: { authorization: `Bearer ${process.env.TWENTY_API_KEY}` },
      body,
    })
  ).data as { success: boolean; error?: string };
};

const createSyncedPerson = async (proopcoId: string | null) =>
  (
    await mutate({
      createPerson: {
        __args: { data: { name: { firstName: 'Gift' }, proopcoId } },
        id: true,
      },
    })
  ).createPerson.id as string;

describe('Gift discount code', () => {
  it('explains a missing proopco configuration without calling out', async () => {
    // Server variables outlive an uninstall, so clear what a previous run left.
    await setServerVariable('PROOPCO_API_BASE_URL', '');
    await setServerVariable('PROOPCO_API_KEY', '');

    const personId = await createSyncedPerson(uniqueId('gift-unset'));

    expect(await gift({ personId, code: 'WELCOME' })).toEqual({
      success: false,
      error: 'PROOPCO_API_BASE_URL and PROOPCO_API_KEY must be set',
    });
  });

  it('needs a person and a code', async () => {
    expect(await gift({ personId: 'x' })).toEqual({
      success: false,
      error: 'personId and code are required',
    });
  });

  describe('against proopco', () => {
    const rejected = new Set<string>(['TAKEN']);
    let stop: (() => Promise<void>) | undefined;
    let requests: Awaited<ReturnType<typeof startStubServer>>['requests'] = [];

    const startProopco = async () => {
      const stub = await startStubServer(({ body }) =>
        rejected.has(body.code)
          ? { status: 422, body: { message: 'Code already applied' } }
          : { status: 200, body: { ok: true } },
      );

      stop = stub.stop;
      requests = stub.requests;
      await setServerVariable('PROOPCO_API_BASE_URL', stub.url);
      await setServerVariable('PROOPCO_API_KEY', 'proopco-test-key');
    };

    afterAll(async () => {
      await stop?.();
    });

    it('applies a code with the API key and the Trader proopcoId', async () => {
      await startProopco();

      const proopcoId = uniqueId('gift-ok');
      const personId = await createSyncedPerson(proopcoId);

      expect(await gift({ personId, code: ' WELCOME ' })).toEqual({
        success: true,
      });
      expect(requests).toHaveLength(1);
      expect(requests[0].headers.authorization).toBe('Bearer proopco-test-key');
      expect(requests[0].body).toEqual({ userId: proopcoId, code: 'WELCOME' });
    });

    it("shows proopco's error when the gift is rejected", async () => {
      const personId = await createSyncedPerson(uniqueId('gift-rejected'));

      expect(await gift({ personId, code: 'TAKEN' })).toEqual({
        success: false,
        error: 'Code already applied',
      });
    });

    it('refuses a person that is not a synced Trader without calling proopco', async () => {
      const before = requests.length;
      const personId = await createSyncedPerson(null);

      expect(await gift({ personId, code: 'WELCOME' })).toEqual({
        success: false,
        error: 'This person is not a synced Trader',
      });
      expect(requests).toHaveLength(before);
    });
  });
});
