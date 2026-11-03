import { fakeSmsProvider } from 'src/providers/fake-sms.provider';
import { httpGatewaySmsProvider } from 'src/providers/http-gateway-sms.provider';
import { type SmsProvider } from 'src/providers/sms-provider.type';

export const getSmsProvider = (
  name = process.env.SMS_PROVIDER,
): SmsProvider => {
  switch (name) {
    case 'FAKE':
      return fakeSmsProvider;
    case 'HTTP_GATEWAY':
      return httpGatewaySmsProvider;
    default:
      throw new Error(`Unknown SMS_PROVIDER "${name}"; refusing to send`);
  }
};
