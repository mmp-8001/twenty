export const TEST_HMAC_SECRET = 'proopco-test-hmac-secret';
export const TEST_PLATFORM_TOKEN = 'proopco-test-platform-token';

// The deployed app is a variant of the real one: cron is stripped and the identity differs, so
// tests drive every handler in-process under a controlled clock and the registry stays separate.
export const TEST_APPLICATION_UNIVERSAL_IDENTIFIER =
  '0fb20dfa-a604-44ae-be58-74392e77d9b9';
export const TEST_VARIANT_DIRECTORY = '.twenty-test-variant';
