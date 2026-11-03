import { randomUUID } from 'crypto';

import { type SmsProvider } from 'src/providers/sms-provider.type';

export const fakeSmsProvider: SmsProvider = {
  send: async () => ({ providerMessageId: `fake-${randomUUID()}` }),
};
