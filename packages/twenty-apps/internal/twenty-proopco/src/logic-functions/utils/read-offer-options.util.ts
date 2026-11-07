import { listRecords, type RecordsClient } from 'src/logic-functions/utils/list-records.util';
import { isOfferExpired } from 'src/utils/offer-activation.util';

type CallNode = { personId: string | null; adminId: string | null; kind: string | null; followupId: string | null };

// CODE-05: a campaign case gets its Campaign's offers, a rebuy case the rebuy set, a retention call the retention set.
export const readCaseOfferIds = async (client: RecordsClient, callId: string): Promise<string[]> => {
  const [call] = await listRecords<CallNode>(client, 'calls', { id: { eq: callId } }, {
    personId: true,
    adminId: true,
    kind: true,
    followupId: true,
  });

  if (!call) {
    return [];
  }

  const [followup] = call.followupId
    ? await listRecords<{ kind: string | null; campaignId: string | null }>(
        client,
        'followups',
        { id: { eq: call.followupId } },
        { kind: true, campaignId: true },
      )
    : [];

  if (followup?.kind === 'CAMPAIGN') {
    return followup.campaignId
      ? (
          await listRecords<{ offerId: string | null }>(
            client,
            'campaignOffers',
            { campaignId: { eq: followup.campaignId } },
            { offerId: true },
          )
        ).flatMap(({ offerId }) => offerId ?? [])
      : [];
  }

  const setType = followup?.kind === 'REBUY' ? 'REBUY' : call.kind === 'RETENTION' ? 'RETENTION' : null;

  return setType
    ? (
        await listRecords<{ offerId: string | null }>(client, 'offerSets', { setType: { eq: setType } }, {
          offerId: true,
        })
      ).flatMap(({ offerId }) => offerId ?? [])
    : [];
};

export type OfferOption = {
  id: string;
  title: string;
  capability: string;
  expiresAt: string | null;
  activation: { id: string; status: string; smsStatus: string; errorMessage: string | null } | null;
};

// The form's code section: deactivated offers and unactivated expired ones are hidden; an offer already
// activated for the user stays visible and disabled (CODE-06). Empty means the section is hidden.
export const readOfferOptions = async ({
  client,
  memberId,
  callId,
  now = new Date(),
}: {
  client: RecordsClient;
  memberId: string;
  callId: string;
  now?: Date;
}): Promise<{ success: true; options: OfferOption[] } | { success: false; error: string }> => {
  const [call] = await listRecords<{ personId: string | null; adminId: string | null; isAnswered: boolean | null }>(
    client,
    'calls',
    { id: { eq: callId } },
    { personId: true, adminId: true, isAnswered: true },
  );

  if (!call || call.adminId !== memberId || !call.personId) {
    return { success: false, error: 'Call not found' };
  }

  if (!call.isAnswered) {
    return { success: true, options: [] };
  }

  const offerIds = [...new Set(await readCaseOfferIds(client, callId))];

  if (offerIds.length === 0) {
    return { success: true, options: [] };
  }

  const offers = await listRecords<{
    id: string;
    title: string | null;
    capability: string | null;
    expiresAt: string | null;
    status: string | null;
  }>(client, 'offers', { id: { in: offerIds }, status: { eq: 'ACTIVE' } }, {
    title: true,
    capability: true,
    expiresAt: true,
    status: true,
  });
  const activations = await listRecords<{
    id: string;
    offerId: string | null;
    status: string | null;
    smsStatus: string | null;
    errorMessage: string | null;
  }>(client, 'offerActivations', { personId: { eq: call.personId }, offerId: { in: offerIds } }, {
    offerId: true,
    status: true,
    smsStatus: true,
    errorMessage: true,
  });
  const activationByOfferId = new Map(activations.map((activation) => [activation.offerId, activation]));

  return {
    success: true,
    options: offers.flatMap((offer) => {
      const activation = activationByOfferId.get(offer.id);

      if (isOfferExpired(offer.expiresAt, now) && !activation) {
        return [];
      }

      return [
        {
          id: offer.id,
          title: offer.title ?? '',
          capability: offer.capability ?? '',
          expiresAt: offer.expiresAt,
          activation: activation
            ? {
                id: activation.id,
                status: activation.status ?? '',
                smsStatus: activation.smsStatus ?? '',
                errorMessage: activation.errorMessage,
              }
            : null,
        },
      ];
    }),
  };
};
