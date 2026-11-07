import { type RecordsClient, updateRecordsWhere } from 'src/logic-functions/utils/list-records.util';

// A purchase that carries a CRM-activated code marks it used for the activating agent (RS2): the credit
// follows the activation, not the owner at purchase time. Conditional on ACTIVE so a resend is a no-op.
export const markOfferCodeUsed = async ({
  client,
  personId,
  offerCode,
  accountId,
  usedAt,
}: {
  client: RecordsClient;
  personId: string;
  offerCode: string | null;
  accountId: string | null;
  usedAt: string;
}): Promise<void> => {
  if (!offerCode) {
    return;
  }

  await updateRecordsWhere(
    client,
    'offerActivations',
    { personId: { eq: personId }, code: { eq: offerCode }, status: { eq: 'ACTIVE' } },
    { status: 'USED', usedAt, usedAccount: accountId },
  );
};
