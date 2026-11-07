import { type MessageDescriptor } from 'twenty-sdk/front-component';
import { type ActivationView } from 'src/utils/offer-activation.util';

export type Translate = (descriptor: string | MessageDescriptor, values?: Record<string, string | number>) => string;

// The maps live in each front component file because translation extraction only reads those files.
export type LabelMap = Record<string, MessageDescriptor>;

export const translateValue = (labels: LabelMap, value: string | null | undefined, t: Translate) => {
  const label = value ? labels[value] : undefined;

  return label ? t(label) : (value ?? '').replace(/_/g, ' ').toLowerCase();
};

// Routes answer with English text; a known message is looked up in the component's list so the UI shows it translated.
export const serverErrorLabel = (
  error: string | undefined,
  fallback: string,
  knownErrors: MessageDescriptor[],
  t: Translate,
) => {
  const known = knownErrors.find(({ message }) => message === error);

  return known ? t(known) : (error ?? fallback);
};

export type ActivationMessages = Record<
  'failed' | 'activating' | 'used' | 'deactivated' | 'active' | 'until' | 'smsNotSent',
  MessageDescriptor
>;

export const activationLabel = (
  { status, smsStatus, expiresAt, deactivatedAt }: ActivationView,
  messages: ActivationMessages,
  t: Translate,
) => {
  switch (status) {
    case 'ACTIVATION_FAILED':
      return t(messages.failed);
    case 'ACTIVATING':
      return t(messages.activating);
    case 'USED':
      return t(messages.used);
    case 'DEACTIVATED':
      return `${t(messages.deactivated)}${deactivatedAt ? `, ${deactivatedAt.slice(0, 10)}` : ''}`;
    default: {
      const until = expiresAt ? ` ${t(messages.until, { until: expiresAt.slice(0, 16).replace('T', ' ') })}` : '';

      return `${t(messages.active)}${until}${smsStatus === 'FAILED' ? ` · ${t(messages.smsNotSent)}` : ''}`;
    }
  }
};
