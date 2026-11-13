import { setup } from '../src/__tests__/global-setup';

// Needs a running server and front, and TWENTY_API_URL / TWENTY_API_KEY like the integration suite.
export default async function globalSetup() {
  await setup();
}
