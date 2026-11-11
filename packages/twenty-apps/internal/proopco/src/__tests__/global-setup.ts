import { buildTestVariant } from './build-test-variant';
import { metadataRequest } from './metadata-request';
import { runTwenty } from './run-twenty';
import {
  TEST_APPLICATION_UNIVERSAL_IDENTIFIER,
  TEST_HMAC_SECRET,
  TEST_PLATFORM_TOKEN,
} from './test-constants';

const DEFERRED_SCHEMA_RETRY_MESSAGE =
  'deferred schema action(s) are still running';
const INSTALL_ATTEMPTS = 60;

const findApplicationId = async (): Promise<string | undefined> => {
  const { findManyApplications } = await metadataRequest<{
    findManyApplications: { id: string; universalIdentifier: string }[];
  }>('query { findManyApplications { id universalIdentifier } }');

  return findManyApplications.find(
    ({ universalIdentifier }) =>
      universalIdentifier === TEST_APPLICATION_UNIVERSAL_IDENTIFIER,
  )?.id;
};

const setVariablesOrThrow = async () => {
  const applicationId = await findApplicationId();

  if (!applicationId) {
    throw new Error('Test variant is not installed');
  }

  for (const [key, value] of Object.entries({
    PLATFORM_HMAC_SECRET: TEST_HMAC_SECRET,
    PLATFORM_API_TOKEN: TEST_PLATFORM_TOKEN,
  })) {
    await metadataRequest(
      `mutation ($key: String!, $value: String!, $applicationId: UUID!) {
        updateOneApplicationVariable(key: $key, value: $value, applicationId: $applicationId)
      }`,
      { key, value, applicationId },
    );
  }
};

const checkServerOrThrow = async (apiUrl: string) => {
  const response = await fetch(`${apiUrl}/healthz`).catch(() => {
    throw new Error(
      `Twenty server is not reachable at ${apiUrl}. Start it before running integration tests.`,
    );
  });

  if (!response.ok) {
    throw new Error(`Server at ${apiUrl} returned ${response.status}`);
  }
};

// Publishing refuses a version that is already registered, so every run starts from a clean registry.
const deleteRegistrationIfAny = async () => {
  const { findApplicationRegistrationByUniversalIdentifier: registration } =
    await metadataRequest<{
      findApplicationRegistrationByUniversalIdentifier: { id: string } | null;
    }>(
      `query ($universalIdentifier: String!) {
        findApplicationRegistrationByUniversalIdentifier(universalIdentifier: $universalIdentifier) { id }
      }`,
      { universalIdentifier: TEST_APPLICATION_UNIVERSAL_IDENTIFIER },
    );

  if (registration) {
    await metadataRequest(
      'mutation ($id: String!) { deleteApplicationRegistration(id: $id) }',
      { id: registration.id },
    );
  }
};

const runOrThrow = async (cliArguments: string[], cwd: string) => {
  const result = await runTwenty(cliArguments, cwd);

  if (!result.ok) {
    throw new Error(
      `${cliArguments.join(' ')} failed: ${result.error.code} ${result.error.message}`,
    );
  }
};

const installOrThrow = async (cwd: string) => {
  for (let attempt = 1; ; attempt += 1) {
    const result = await runTwenty(['app', 'install'], cwd);

    if (result.ok) {
      return;
    }

    if (
      attempt === INSTALL_ATTEMPTS ||
      !result.error.message.includes(DEFERRED_SCHEMA_RETRY_MESSAGE)
    ) {
      throw new Error(
        `app install failed: ${result.error.code} ${result.error.message}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
};

export async function setup() {
  const { TWENTY_API_URL, TWENTY_API_KEY } = process.env;

  if (!TWENTY_API_URL || !TWENTY_API_KEY) {
    throw new Error('TWENTY_API_URL and TWENTY_API_KEY must be set.');
  }

  await checkServerOrThrow(TWENTY_API_URL);
  await teardown();

  const variantRoot = buildTestVariant();

  await runOrThrow(['app', 'publish', '--private'], variantRoot);
  await installOrThrow(variantRoot);
  // The tests' typed client must match the schema this install just created.
  await runOrThrow(['app', 'generate-client'], variantRoot);
  await setVariablesOrThrow();
}

export async function teardown() {
  const variantRoot = buildTestVariant();
  const result = await runTwenty(['app', 'uninstall', '--yes'], variantRoot);

  if (
    !result.ok &&
    result.error.code !== 'APP_NOT_INSTALLED' &&
    !result.error.message.includes('Could not find application')
  ) {
    throw new Error(
      `App uninstall failed: ${result.error.code} ${result.error.message}`,
    );
  }

  await deleteRegistrationIfAny();
}
