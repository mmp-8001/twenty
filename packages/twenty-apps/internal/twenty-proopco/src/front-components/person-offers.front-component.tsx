import { useEffect, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { enqueueSnackbar, msg, Trans, useRecordId, useTranslate } from 'twenty-sdk/front-component';

import { ACTIVATE_OFFER_ROUTE_PATH, RESEND_OFFER_SMS_ROUTE_PATH } from 'src/constants/offer.constant';
import { PERSON_DETAILS_ROUTE_PATH } from 'src/constants/ownership.constant';
import { PERSON_OFFERS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { activationLabel, serverErrorLabel } from 'src/utils/front-labels.util';
import { describeActivation } from 'src/utils/offer-activation.util';
import { postRoute } from 'src/utils/post-route.util';

type ActivationRow = {
  id: string;
  status: string | null;
  smsStatus: string | null;
  errorMessage: string | null;
  offerId: string | null;
  offer: { title: string | null; expiresAt: string | null; deactivatedAt: string | null } | null;
};

const SERVER_ERRORS = [
  msg('Sign in required'),
  msg('Your account is frozen or deactivated'),
  msg('You can only activate offers for users in your follow-up list'),
  msg('Offers can only be activated after an answered call'),
  msg('This offer is not available'),
  msg('This offer is already activated for this user'),
  msg('The user has no phone number'),
  msg('SMS not sent'),
];

const ACTIVATION_MESSAGES = {
  failed: msg('Activation failed'),
  activating: msg('Activating…'),
  used: msg('Code used'),
  deactivated: msg('Deactivated by Full Admin'),
  active: msg('Active for this user'),
  until: msg('until {until} UTC'),
  smsNotSent: msg('SMS not sent'),
};

const PersonOffers = () => {
  const personId = useRecordId();
  const { t } = useTranslate();
  const [rows, setRows] = useState<ActivationRow[]>([]);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!personId) {
      return;
    }

    postRoute<{ success: boolean; activations?: ActivationRow[] }>(PERSON_DETAILS_ROUTE_PATH, { personId })
      .then((result) => setRows(result.activations ?? []))
      .catch(() => setRows([]));
  }, [personId, reloadCount]);

  const run = async (path: string, body: Record<string, unknown>) => {
    const result = await postRoute<{ success: boolean; error?: string }>(path, body);

    await enqueueSnackbar(
      result.success
        ? { message: t('Done'), variant: 'success' }
        : { message: serverErrorLabel(result.error, t('Failed'), SERVER_ERRORS, t), variant: 'error' },
    );
    setReloadCount((count) => count + 1);
  };

  if (rows.length === 0) {
    return <p style={{ padding: 16 }}>
        <Trans>No offers activated.</Trans>
      </p>;
  }

  return (
    <ul style={{ padding: 16 }}>
      {rows.map((row) => {
        const view = {
          status: row.status ?? '',
          smsStatus: row.smsStatus ?? '',
          expiresAt: row.offer?.expiresAt ?? null,
          deactivatedAt: row.offer?.deactivatedAt ?? null,
        };
        const { action } = describeActivation(view);

        return (
          <li key={row.id}>
            {row.offer?.title}: {activationLabel(view, ACTIVATION_MESSAGES, t)}
            {row.status === 'ACTIVATION_FAILED' && row.errorMessage ? ` (${row.errorMessage})` : ''}
            {action === 'RETRY' && (
              <button type="button" onClick={() => run(ACTIVATE_OFFER_ROUTE_PATH, { personId, offerId: row.offerId })}>
                <Trans>Retry</Trans>
              </button>
            )}
            {action === 'RESEND_SMS' && (
              <button type="button" onClick={() => run(RESEND_OFFER_SMS_ROUTE_PATH, { activationId: row.id })}>
                <Trans>Resend SMS</Trans>
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
