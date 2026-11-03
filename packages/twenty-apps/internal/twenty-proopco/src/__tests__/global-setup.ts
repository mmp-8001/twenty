import { APPLICATION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { metadataRequest } from './metadata-request';
import { runTwenty } from './run-twenty';
import { TEST_SYNC_TOKEN } from './test-constants';

async function setSyncTokenOrThrow() {
  const { findApplicationRegistrationByUniversalIdentifier: registration } =
    await metadataRequest<{
      findApplicationRegistrationByUniversalIdentifier: { id: string };
    }>(
      `query ($universalIdentifier: String!) {
        findApplicationRegistrationByUniversalIdentifier(universalIdentifier: $universalIdentifier) { id }
      }`,
      { universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER },
    );
  const { findApplicationRegistrationVariables: variables } =
    await metadataRequest<{
      findApplicationRegistrationVariables: { id: string; key: string }[];
    }>(
      `query ($id: String!) {
        findApplicationRegistrationVariables(applicationRegistrationId: $id) { id key }
      }`,
      { id: registration.id },
    );
  const syncToken = variables.find(
    (variable) => variable.key === 'PROOPCO_SYNC_TOKEN',
  );

  if (!syncToken) {
    throw new Error('PROOPCO_SYNC_TOKEN server variable was not created');
  }

  await metadataRequest(
    `mutation ($input: UpdateApplicationRegistrationVariableInput!) {
      updateApplicationRegistrationVariable(input: $input) { id }
    }`,
    { input: { id: syncToken.id, update: { value: TEST_SYNC_TOKEN } } },
  );
}

function validateEnvironmentOrThrow(): { apiUrl: string; apiKey: string } {
  const apiUrl = process.env.TWENTY_API_URL;
  const apiKey = process.env.TWENTY_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      'TWENTY_API_URL and TWENTY_API_KEY must be set.\n' +
        'Or set them in vitest env config.',
    );
  }

  return { apiUrl, apiKey };
}

async function checkServerOrThrow(apiUrl: string) {
  const response = await fetch(`${apiUrl}/healthz`).catch(() => {
    throw new Error(
      `Twenty server is not reachable at ${apiUrl}. ` +
        'Make sure the server is running before executing integration tests.',
    );
  });

  if (!response.ok) {
    throw new Error(`Server at ${apiUrl} returned ${response.status}`);
  }
}

export async function setup() {
  const { apiUrl } = validateEnvironmentOrThrow();

  await checkServerOrThrow(apiUrl);
  await teardown();

  const result = await runTwenty(['app', 'apply', '--create']);

  if (!result.ok) {
    throw new Error(
      `App apply failed: ${result.error.code} ${result.error.message}`,
    );
  }

  await setSyncTokenOrThrow();
}

export async function teardown() {
  const result = await runTwenty(['app', 'uninstall', '--yes']);

  if (!result.ok && result.error.code !== 'APP_NOT_INSTALLED') {
    throw new Error(
      `App uninstall failed: ${result.error.code} ${result.error.message}`,
    );
  }
}
