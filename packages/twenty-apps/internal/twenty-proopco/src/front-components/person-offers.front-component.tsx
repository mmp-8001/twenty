import { useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import { enqueueSnackbar, useRecordId } from 'twenty-sdk/front-component';

import { ACTIVATE_OFFER_ROUTE_PATH, RESEND_OFFER_SMS_ROUTE_PATH } from 'src/constants/offer.constant';
import { PERSON_OFFERS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { describeActivation } from 'src/utils/offer-activation.util';

type ActivationRow = {
  id: string;
  status: string | null;
  smsStatus: string | null;
  errorMessage: string | null;
  offerId: string | null;
  offer: { title: string | null; expiresAt: string | null; deactivatedAt: string | null } | null;
};

const PersonOffers = () => {
  const personId = useRecordId();
  const [rows, setRows] = useState<ActivationRow[]>([]);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!personId) {
      return;
    }

    (new CoreApiClient().query({
      offerActivations: {
        __args: { filter: { personId: { eq: personId } }, first: 50 },
        edges: {
          node: {
            id: true,
            status: true,
            smsStatus: true,
            errorMessage: true,
            offerId: true,
            offer: { title: true, expiresAt: true, deactivatedAt: true },
          },
        },
      },
    } as never) as Promise<unknown>)
      .then((result) =>
        setRows(
          (result as { offerActivations: { edges: { node: ActivationRow }[] } }).offerActivations.edges.map(
            ({ node }) => node,
          ),
        ),
      )
      .catch(() => setRows([]));
  }, [personId, reloadCount]);

  const run = async (path: string, body: Record<string, unknown>) => {
    const result = await new RestApiClient().post<{ success: boolean; error?: string }>(`/s${path}`, body);

    await enqueueSnackbar(
      result.success
        ? { message: 'Done', variant: 'success' }
        : { message: result.error ?? 'Failed', variant: 'error' },
    );
    setReloadCount((count) => count + 1);
  };

  if (rows.length === 0) {
    return <p style={{ padding: 16 }}>No offers activated.</p>;
  }

  return (
    <ul style={{ padding: 16 }}>
      {rows.map((row) => {
        const { label, action } = describeActivation({
          status: row.status ?? '',
          smsStatus: row.smsStatus ?? '',
          expiresAt: row.offer?.expiresAt ?? null,
          deactivatedAt: row.offer?.deactivatedAt ?? null,
        });

        return (
          <li key={row.id}>
            {row.offer?.title}: {label}
            {row.status === 'ACTIVATION_FAILED' && row.errorMessage ? ` (${row.errorMessage})` : ''}
            {action === 'RETRY' && (
              <button type="button" onClick={() => run(ACTIVATE_OFFER_ROUTE_PATH, { personId, offerId: row.offerId })}>
                Retry
              </button>
            )}
            {action === 'RESEND_SMS' && (
              <button type="button" onClick={() => run(RESEND_OFFER_SMS_ROUTE_PATH, { activationId: row.id })}>
                Resend SMS
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default defineFrontComponent({
  universalIdentifier: PERSON_OFFERS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'person-offers',
  description: 'Offers activated for the User, with Retry and Resend SMS.',
  component: PersonOffers,
});
