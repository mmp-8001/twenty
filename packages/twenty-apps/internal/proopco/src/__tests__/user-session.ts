import { metadataRequest } from './metadata-request';

// Every dev-seed user shares one password; the origin is the workspace's front URL.
const SEED_PASSWORD = 'tim@apple.dev';

const frontendOrigin = () =>
  process.env.TWENTY_TEST_ORIGIN ??
  process.env.TWENTY_API_URL!.replace(':3000', ':3001');

export const signInAs = async (email: string): Promise<string> => {
  const origin = frontendOrigin();
  const { getLoginTokenFromCredentials } = await metadataRequest<{
    getLoginTokenFromCredentials: { loginToken: { token: string } };
  }>(
    `mutation ($email: String!, $password: String!, $origin: String!) {
      getLoginTokenFromCredentials(email: $email, password: $password, origin: $origin) { loginToken { token } }
    }`,
    { email, password: SEED_PASSWORD, origin },
  );
  const { getAuthTokensFromLoginToken } = await metadataRequest<{
    getAuthTokensFromLoginToken: {
      tokens: { accessOrWorkspaceAgnosticToken: { token: string } };
    };
  }>(
    `mutation ($loginToken: String!, $origin: String!) {
      getAuthTokensFromLoginToken(loginToken: $loginToken, origin: $origin) { tokens { accessOrWorkspaceAgnosticToken { token } } }
    }`,
    { loginToken: getLoginTokenFromCredentials.loginToken.token, origin },
  );

  return getAuthTokensFromLoginToken.tokens.accessOrWorkspaceAgnosticToken
    .token;
};

export const graphqlAs = async (
  token: string,
  query: string,
  variables: Record<string, unknown> = {},
) => {
  const response = await fetch(`${process.env.TWENTY_API_URL}/graphql`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  return (await response.json()) as {
    data?: Record<string, unknown> | null;
    errors?: { message: string }[];
  };
};

export const assignRole = (workspaceMemberId: string, roleId: string) =>
  metadataRequest(
    `mutation ($roleId: UUID!, $workspaceMemberId: UUID!) {
      updateWorkspaceMemberRole(roleId: $roleId, workspaceMemberId: $workspaceMemberId) { id }
    }`,
    { roleId, workspaceMemberId },
  );

export const listRoles = async () =>
  (
    await metadataRequest<{
      getRoles: {
        id: string;
        universalIdentifier: string;
        workspaceMembers: { id: string }[];
      }[];
    }>('{ getRoles { id universalIdentifier workspaceMembers { id } } }')
  ).getRoles;
