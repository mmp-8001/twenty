import {
  ANSWERED_CALL_REQUIRED_MESSAGE,
  OFFER_ALREADY_ACTIVE_MESSAGE,
  OFFER_NOT_AVAILABLE_MESSAGE,
} from 'src/constants/offer.constant';
import { getCodeServiceProvider } from 'src/logic-functions/utils/code-service/get-code-service-provider';
import { enqueueSms, toE164, type SmsPhones } from 'src/logic-functions/utils/enqueue-sms.util';
import {
  createRecord,
  listRecords,
  type RecordsClient,
  updateRecord,
  updateRecordsWhere,
} from 'src/logic-functions/utils/list-records.util';
import { readCaseOfferIds } from 'src/logic-functions/utils/read-offer-options.util';
import {
  buildActivationKey,
  buildOfferSmsBody,
  buildSmsSourceRef,
  decideActivation,
  type ActivationRefusal,
} from 'src/utils/offer-activation.util';

export type OfferRouteResult =
  | { success: true; activationId: string; smsStatus: string }
  | { success: false; error: string; activationId?: string };

type OfferNode = {
  title: string | null;
  capability: string | null;
  discountParams: unknown;
  expiresAt: string | null;
  status: string | null;
};

type PersonNode = { currentOwnerId: string | null; proopcoId: string | null; phones: SmsPhones };

const REFUSAL_MESSAGES: Record<ActivationRefusal, string> = {
  NOT_OWNER: 'You can only activate offers for users in your follow-up list',
  CALL_NOT_ANSWERED: ANSWERED_CALL_REQUIRED_MESSAGE,
  OFFER_UNAVAILABLE: OFFER_NOT_AVAILABLE_MESSAGE,
  ALREADY_ACTIVE: OFFER_ALREADY_ACTIVE_MESSAGE,
};

export const PHONE_SELECTION = { phones: { primaryPhoneNumber: true, primaryPhoneCallingCode: true } };

// CODE-07: queued with the SMS app; a failure only marks the SMS, the code stays active (CODE-08).
export const sendActivationSms = async ({
  client,
  activationId,
  phones,
  code,
  offer,
  now,
}: {
  client: RecordsClient;
  activationId: string;
  phones: SmsPhones;
  code: string;
  offer: Pick<OfferNode, 'capability' | 'expiresAt'>;
  now: Date;
}): Promise<'SENT' | 'FAILED'> => {
  const to = toE164(phones);
  const result = to
    ? await enqueueSms({
        to,
        sourceRef: buildSmsSourceRef(activationId),
        body: buildOfferSmsBody({ code, capability: offer.capability ?? '', expiresAt: offer.expiresAt }),
      })
    : { success: false as const, error: 'The user has no phone number' };
  const smsStatus = result.success ? 'SENT' : 'FAILED';

  await updateRecord(client, 'OfferActivation', activationId, {
    smsStatus,
    smsSentAt: result.success ? now.toISOString() : null,
    ...(result.success ? {} : { errorMessage: result.error }),
  });

  return smsStatus;
};

// Activates, or retries a failed activation of, one Offer for one User (CODE-04, CODE-06, CODE-08).
export const activateOffer = async ({
  client,
  memberId,
  personId,
  offerId,
  callId,
  now = new Date(),
}: {
  client: RecordsClient;
  memberId: string;
  personId: string;
  offerId: string;
  callId: string | null;
  now?: Date;
}): Promise<OfferRouteResult> => {
  const fail = (error: string, activationId?: string): OfferRouteResult => ({ success: false, error, activationId });
  const activationKey = buildActivationKey(offerId, personId);
  const [existing] = await listRecords<{ id: string; status: string | null; callId: string | null }>(
    client,
    'offerActivations',
    { activationKey: { eq: activationKey } },
    { status: true, callId: true },
  );
  const effectiveCallId = callId ?? existing?.callId ?? null;
  const [person] = await listRecords<PersonNode>(client, 'people', { id: { eq: personId } }, {
    currentOwnerId: true,
    proopcoId: true,
    ...PHONE_SELECTION,
  });
  const [call] = effectiveCallId
    ? await listRecords<{ adminId: string | null; personId: string | null; isAnswered: boolean | null }>(
        client,
        'calls',
        { id: { eq: effectiveCallId } },
        { adminId: true, personId: true, isAnswered: true },
      )
    : [];
  const [offer] = await listRecords<OfferNode>(client, 'offers', { id: { eq: offerId } }, {
    title: true,
    capability: true,
    discountParams: true,
    expiresAt: true,
    status: true,
  });
  const isCallOfCaller = call?.adminId === memberId && call.personId === personId;
  const refusal = decideActivation({
    isOwner: person?.currentOwnerId === memberId && isCallOfCaller,
    isCallAnswered: call?.isAnswered === true,
    offer: offer ?? null,
    existingStatus: existing?.status ?? null,
    now,
  });

  if (refusal) {
    return fail(REFUSAL_MESSAGES[refusal]);
  }

  // The form only offers the case's own offers; the route holds the same line.
  if (!effectiveCallId || !(await readCaseOfferIds(client, effectiveCallId)).includes(offerId)) {
    return fail(OFFER_NOT_AVAILABLE_MESSAGE);
  }

  let activationId = existing?.id;

  if (existing) {
    const claimed = await updateRecordsWhere(
      client,
      'offerActivations',
      { id: { eq: existing.id }, status: { eq: 'ACTIVATION_FAILED' } },
      { status: 'ACTIVATING', errorMessage: null },
    );

    if (claimed.length === 0) {
      return fail(OFFER_ALREADY_ACTIVE_MESSAGE);
    }
  } else {
    try {
      activationId = await createRecord(client, 'OfferActivation', {
        activationKey,
        offerId,
        personId,
        adminId: memberId,
        callId: effectiveCallId,
        status: 'ACTIVATING',
        smsStatus: 'PENDING',
      });
    } catch {
      // The unique key: a concurrent click already created it.
      return fail(OFFER_ALREADY_ACTIVE_MESSAGE);
    }
  }

  const provider = (() => {
    try {
      return getCodeServiceProvider();
    } catch (error) {
      return error instanceof Error ? error : new Error(String(error));
    }
  })();
  const result =
    provider instanceof Error
      ? { success: false as const, error: provider.message }
      : person?.proopcoId
        ? await provider.activate({
            userProopcoId: person.proopcoId,
            capability: (offer.capability ?? '').toLowerCase(),
            params: offer.discountParams,
            expiresAt: offer.expiresAt,
          })
        : { success: false as const, error: 'This person is not a synced User' };

  if (!result.success) {
    await updateRecord(client, 'OfferActivation', activationId!, {
      status: 'ACTIVATION_FAILED',
      errorMessage: result.error,
      adminId: memberId,
      callId: effectiveCallId,
    });

    return fail(result.error, activationId);
  }

  await updateRecord(client, 'OfferActivation', activationId!, {
    status: 'ACTIVE',
    code: result.code,
    externalCodeId: result.externalCodeId,
    errorMessage: null,
    adminId: memberId,
    callId: effectiveCallId,
  });

  const smsStatus = await sendActivationSms({
    client,
    activationId: activationId!,
    phones: person.phones,
    code: result.code,
    offer,
    now,
  });

  return { success: true, activationId: activationId!, smsStatus };
};

export const resendOfferSms = async ({
  client,
  memberId,
  activationId,
  now = new Date(),
}: {
  client: RecordsClient;
  memberId: string;
  activationId: string;
  now?: Date;
}): Promise<OfferRouteResult> => {
  const [activation] = await listRecords<{
    status: string | null;
    code: string | null;
    adminId: string | null;
    personId: string | null;
    offerId: string | null;
  }>(client, 'offerActivations', { id: { eq: activationId } }, {
    status: true,
    code: true,
    adminId: true,
    personId: true,
    offerId: true,
  });
  const [person] = activation?.personId
    ? await listRecords<PersonNode>(client, 'people', { id: { eq: activation.personId } }, {
        currentOwnerId: true,
        proopcoId: true,
        ...PHONE_SELECTION,
      })
    : [];
  const [offer] = activation?.offerId
    ? await listRecords<OfferNode>(client, 'offers', { id: { eq: activation.offerId } }, {
        capability: true,
        expiresAt: true,
        status: true,
      })
    : [];

  if (!activation || !person || (activation.adminId !== memberId && person.currentOwnerId !== memberId)) {
    return { success: false, error: OFFER_NOT_AVAILABLE_MESSAGE };
  }

  if (activation.status !== 'ACTIVE' || !activation.code || !offer) {
    return { success: false, error: OFFER_NOT_AVAILABLE_MESSAGE };
  }

  const smsStatus = await sendActivationSms({
    client,
    activationId,
    phones: person.phones,
    code: activation.code,
    offer,
    now,
  });

  return smsStatus === 'SENT'
    ? { success: true, activationId, smsStatus }
    : { success: false, error: 'SMS not sent', activationId };
};
