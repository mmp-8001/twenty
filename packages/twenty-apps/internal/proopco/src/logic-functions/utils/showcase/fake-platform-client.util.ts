import { type PlatformClient } from 'src/logic-functions/utils/platform-client.util';

// Showcase codes, activations and SMS never reach the real platform.
export const createFakePlatformClient = (): PlatformClient => ({
  createCode: async ({ code }) => ({ platformCodeId: `showcase-${code}` }),
  deactivateCode: async () => undefined,
  activateCode: async () => undefined,
  sendSms: async () => undefined,
});
