import { metadataRequest } from './metadata-request';

// Every seeded dev user shares the dev seeder's password (seed-users.util.ts in twenty-server).
const SEEDED_PASSWORD = 'tim@apple.dev';
const WORKSPACE_ORIGIN =
  process.env.TWENTY_WORKSPACE_ORIGIN ?? 'http://localhost:3001';

export const SEEDED_ADMIN_EMAIL = 'jane.austen@apple.dev';
export const SEEDED_AGENT_EMAIL = 'jony.ive@apple.dev';
export const SEEDED_OTHER_AGENT_EMAIL = 'phil.schiler@apple.dev';
export const SEEDED_MANAGER_EMAIL = 'tim@apple.dev';

type GraphqlResult<TData> = {
  data?: TData;
  errors?: { message: string }[];
};

export const userRequest = async <TData>({
  token,
  path = 'graphql',
  query,
  variables = {},
}: {
  token: string;
  path?: 'graphql' | 'metadata';
  query: string;
  variables?: Record<string, unknown>;
}): Promise<GraphqlResult<TData>> => {
  const response = await fetch(`${process.env.TWENTY_API_URL}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  return (await response.json()) as GraphqlResult<TData>;
};

const unauthenticatedMetadataRequest = async <TData>(
  query: string,
  variables: Record<string, unknown>,
): Promise<TData> => {
  const response = await fetch(`${process.env.TWENTY_API_URL}/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const { data, errors } = (await response.json()) as GraphqlResult<TData>;

  if (!data) {
    throw new Error(`Sign-in failed: ${errors?.[0]?.message}`);
  }

  return data;
};

export const signIn = async (email: string): Promise<string> => {
  const { getLoginTokenFromCredentials } = await unauthenticatedMetadataRequest<{
    getLoginTokenFromCredentials: { loginToken: { token: string } };
  }>(
    `mutation ($email: String!, $password: String!, $origin: String!) {
      getLoginTokenFromCredentials(email: $email, password: $password, origin: $origin) {
        loginToken { token }
      }
    }`,
    { email, password: SEEDED_PASSWORD, origin: WORKSPACE_ORIGIN },
  );
  const { getAuthTokensFromLoginToken } = await unauthenticatedMetadataRequest<{
    getAuthTokensFromLoginToken: {
      tokens: { accessOrWorkspaceAgnosticToken: { token: string } };
    };
  }>(
    `mutation ($loginToken: String!, $origin: String!) {
      getAuthTokensFromLoginToken(loginToken: $loginToken, origin: $origin) {
        tokens { accessOrWorkspaceAgnosticToken { token } }
      }
    }`,
    {
      loginToken: getLoginTokenFromCredentials.loginToken.token,
      origin: WORKSPACE_ORIGIN,
    },
  );

  return getAuthTokensFromLoginToken.tokens.accessOrWorkspaceAgnosticToken
    .token;
};

type RoleNode = {
  id: string;
  label: string;
  workspaceMembers: { id: string; userEmail: string }[];
};

const loadRoles = async () =>
  (
    await metadataRequest<{ getRoles: RoleNode[] }>(
      '{ getRoles { id label workspaceMembers { id userEmail } } }',
    )
  ).getRoles;

// Assigns roles to seeded members as the seeded admin and returns what is needed to undo it.
export const assignSeededRoles = async (
  assignments: { email: string; roleLabel: string }[],
) => {
  const adminToken = await signIn(SEEDED_ADMIN_EMAIL);
  const roles = await loadRoles();
  const changeRole = async (workspaceMemberId: string, roleId: string) => {
    const { errors } = await userRequest({
      token: adminToken,
      path: 'metadata',
      query: `mutation ($workspaceMemberId: UUID!, $roleId: UUID!) {
        updateWorkspaceMemberRole(workspaceMemberId: $workspaceMemberId, roleId: $roleId) { id }
      }`,
      variables: { workspaceMemberId, roleId },
    });

    if (errors?.length) {
      throw new Error(`Role assignment failed: ${errors[0].message}`);
    }
  };
  const memberIds: Record<string, string> = {};
  const previous: { workspaceMemberId: string; roleId: string }[] = [];

  for (const { email, roleLabel } of assignments) {
    const current = roles.find((role) =>
      role.workspaceMembers.some((member) => member.userEmail === email),
    );
    const member = current?.workspaceMembers.find(
      (candidate) => candidate.userEmail === email,
    );
    const target = roles.find((role) => role.label === roleLabel);

    if (!current || !member || !target) {
      throw new Error(`Cannot assign ${roleLabel} to ${email}`);
    }

    memberIds[email] = member.id;
    previous.push({ workspaceMemberId: member.id, roleId: current.id });
    await changeRole(member.id, target.id);
  }

  return {
    memberIds,
    restore: async () => {
      for (const { workspaceMemberId, roleId } of previous) {
        await changeRole(workspaceMemberId, roleId);
      }
    },
  };
};

// Runs the deployed post-install function the way an admin session would invoke it.
export const runDeployedPostInstall = async () => {
  const token = await signIn(SEEDED_ADMIN_EMAIL);
  const { findManyLogicFunctions } = await metadataRequest<{
    findManyLogicFunctions: { id: string; name: string }[];
  }>('{ findManyLogicFunctions { id name } }');
  const postInstall = findManyLogicFunctions.find(
    ({ name }) => name === 'post-install',
  );
  const { data, errors } = await userRequest<{
    executeOneLogicFunction: { status: string; error: unknown };
  }>({
    token,
    path: 'metadata',
    query: `mutation ($id: UUID!) {
      executeOneLogicFunction(input: { id: $id, payload: {} }) { status error }
    }`,
    variables: { id: postInstall?.id },
  });

  if (errors?.length || data?.executeOneLogicFunction.status !== 'SUCCESS') {
    throw new Error(`post-install failed: ${JSON.stringify(errors ?? data)}`);
  }
};
