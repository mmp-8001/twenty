import { type OFFER_CAPABILITIES } from 'src/constants/offer.constant';

// One activation per offer and user; the unique index on this key enforces it.
export const buildActivationKey = (offerId: string, personId: string) => `${offerId}:${personId}`;

// The SMS app dedups on this, so resending the same activation never texts twice.
export const buildSmsSourceRef = (activationId: string) => `offer-activation:${activationId}`;

// A fixed instant, hidden from the form once passed and never recomputed per user.
export const isOfferExpired = (expiresAt: string | null, now: Date) =>
  expiresAt !== null && new Date(expiresAt).getTime() <= now.getTime();

export const buildOfferSmsBody = ({
  code,
  capability,
  expiresAt,
}: {
  code: string;
  capability: (typeof OFFER_CAPABILITIES)[number] | string;
  expiresAt: string | null;
}) =>
  `Your Proopco code: ${code} (${capability.toLowerCase()})${
    expiresAt ? `, valid until ${expiresAt.slice(0, 16).replace('T', ' ')} UTC` : ''
  }`;

export type ActivationRefusal = 'OFFER_UNAVAILABLE' | 'ALREADY_ACTIVE' | 'CALL_NOT_ANSWERED' | 'NOT_OWNER';

// An existing ACTIVATION_FAILED row may be retried; any other existing row is a second activation.
export const decideActivation = ({
  isOwner,
  isCallAnswered,
  offer,
  existingStatus,
  now,
}: {
  isOwner: boolean;
  isCallAnswered: boolean;
  offer: { status: string | null; expiresAt: string | null } | null;
  existingStatus: string | null;
  now: Date;
}): ActivationRefusal | null => {
  if (!isOwner) {
    return 'NOT_OWNER';
  }

  if (!isCallAnswered) {
    return 'CALL_NOT_ANSWERED';
  }

  if (!offer || offer.status !== 'ACTIVE' || isOfferExpired(offer.expiresAt, now)) {
    return 'OFFER_UNAVAILABLE';
  }

  return existingStatus !== null && existingStatus !== 'ACTIVATION_FAILED' ? 'ALREADY_ACTIVE' : null;
};

export type ActivationView = {
  status: string;
  smsStatus: string;
  expiresAt: string | null;
  deactivatedAt: string | null;
};

// What User details and the form show for an activation, and which button it offers.
export const describeActivation = ({
  status,
  smsStatus,
  expiresAt,
  deactivatedAt,
}: ActivationView): { label: string; action: 'RETRY' | 'RESEND_SMS' | null } => {
  const until = expiresAt ? ` until ${expiresAt.slice(0, 16).replace('T', ' ')} UTC` : '';

  switch (status) {
    case 'ACTIVATION_FAILED':
      return { label: 'Activation failed', action: 'RETRY' };
    case 'ACTIVATING':
      return { label: 'Activating…', action: null };
    case 'USED':
      return { label: 'Code used', action: null };
    case 'DEACTIVATED':
      return {
        label: `Deactivated by Full Admin${deactivatedAt ? `, ${deactivatedAt.slice(0, 10)}` : ''}`,
        action: null,
      };
    default:
      return smsStatus === 'FAILED'
        ? { label: `Active for this user${until} · SMS not sent`, action: 'RESEND_SMS' }
        : { label: `Active for this user${until}`, action: null };
  }
};
