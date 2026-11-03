export const TEST_ENQUEUE_TOKEN = 'sms-integration-enqueue-token';
export const TEST_CALLBACK_TOKEN = 'sms-integration-callback-token';
export const TEST_RATE_PER_MINUTE = 3;

export const TEST_SERVER_VARIABLES: Record<string, string> = {
  SMS_PROVIDER: 'FAKE',
  SMS_SENDER: 'TestSender',
  RATE_PER_MINUTE: String(TEST_RATE_PER_MINUTE),
  ENQUEUE_TOKEN: TEST_ENQUEUE_TOKEN,
  SMS_CALLBACK_TOKEN: TEST_CALLBACK_TOKEN,
};
