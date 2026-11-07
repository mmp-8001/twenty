import { SMS_ENQUEUE_TOKEN_HEADER } from 'src/constants/offer.constant';

export type SmsPhones = {
  primaryPhoneNumber?: string | null;
  primaryPhoneCallingCode?: string | null;
} | null | undefined;

export const toE164 = (phones: SmsPhones): string | undefined => {
  const number = phones?.primaryPhoneNumber?.trim();

  if (!number) {
    return undefined;
  }

  if (number.startsWith('+')) {
    return number;
  }

  // The SMS app rejects what is still not E.164 as invalid.
  return `${phones?.primaryPhoneCallingCode ?? ''}${number.replace(/\D/g, '')}`;
};

export type SmsResult = { success: true } | { success: false; error: string };

// Queued is not delivered: the SMS app sends later, so a failure here is an enqueue failure only.
export const enqueueSms = async (message: { to: string; body: string; sourceRef: string }): Promise<SmsResult> => {
  const url = process.env.SMS_ENQUEUE_URL;
  const token = process.env.SMS_ENQUEUE_TOKEN;

  if (!url || !token) {
    return { success: false, error: 'SMS is not configured: set SMS_ENQUEUE_URL and SMS_ENQUEUE_TOKEN' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', [SMS_ENQUEUE_TOKEN_HEADER]: token },
      body: JSON.stringify({ messages: [message] }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
      results?: { status?: string }[];
    };

    if (!response.ok || !result.success) {
      return { success: false, error: result.error ?? `SMS enqueue answered ${response.status}` };
    }

    const status = result.results?.[0]?.status;

    return status && ['invalid', 'skipped_opt_out', 'failed'].includes(status)
      ? { success: false, error: `SMS not queued: ${status}` }
      : { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};
