import { listRecords, type RecordsClient } from 'src/logic-functions/utils/list-records.util';

export type PersonAccount = { id: string; proopcoId: string | null; status: string | null; phase: string | null };

export type PersonActivation = {
  id: string;
  status: string | null;
  smsStatus: string | null;
  errorMessage: string | null;
  offerId: string | null;
  offer: { title: string | null; expiresAt: string | null; deactivatedAt: string | null } | null;
};

// Sales Admins cannot read accounts or activations directly (no row rule scopes them to a User), so the
// caller's own token decides whether the User is visible and the app reads the rest.
export const readPersonDetails = async ({
  userClient,
  appClient,
  personId,
}: {
  userClient: RecordsClient;
  appClient: RecordsClient;
  personId: string;
}): Promise<
  { success: true; accounts: PersonAccount[]; activations: PersonActivation[] } | { success: false; error: string }
> => {
  const visible = await listRecords(userClient, 'people', { id: { eq: personId } }, {});

  if (visible.length === 0) {
    return { success: false, error: 'User not found' };
  }

  return {
    success: true,
    accounts: await listRecords<PersonAccount>(appClient, 'challengeAccounts', { personId: { eq: personId } }, {
      proopcoId: true,
      status: true,
      phase: true,
    }),
    activations: await listRecords<PersonActivation>(appClient, 'offerActivations', { personId: { eq: personId } }, {
      status: true,
      smsStatus: true,
      errorMessage: true,
      offerId: true,
      offer: { title: true, expiresAt: true, deactivatedAt: true },
    }),
  };
};
