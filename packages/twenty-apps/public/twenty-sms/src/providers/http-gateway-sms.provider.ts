import { type SmsProvider } from 'src/providers/sms-provider.type';

// Generic JSON gateway: POST { from, to, body } with a bearer key, answer { id }.
export const httpGatewaySmsProvider: SmsProvider = {
  send: async (message) => {
    const url = process.env.SMS_PROVIDER_URL;

    if (!url) {
      throw new Error('SMS_PROVIDER_URL is not set');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.SMS_PROVIDER_API_KEY ?? ''}`,
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error((await response.text()) || `HTTP ${response.status}`);
    }

    const { id } = (await response.json()) as { id?: string };

    if (!id) {
      throw new Error('Gateway answered without a message id');
    }

    return { providerMessageId: String(id) };
  },
};
