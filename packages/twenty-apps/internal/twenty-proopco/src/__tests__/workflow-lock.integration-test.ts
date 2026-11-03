import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  assignSeededRoles,
  SEEDED_ADMIN_EMAIL,
  SEEDED_MANAGER_EMAIL,
  signIn,
  userRequest,
} from './seeded-sessions';

type WorkflowNode = { id: string; name: string; isSystem: boolean };

const LIST_WORKFLOWS = `{
  coreWorkflows(first: 50) { edges { node { id name isSystem } } }
}`;

// Workflow editing is a settings permission (WORKFLOWS) that the Sales Manager role does not hold.
describe('System workflows', () => {
  let restoreRoles: () => Promise<void>;
  let managerToken: string;
  let adminToken: string;

  const listAsAdmin = async () => {
    const { data, errors } = await userRequest<{
      coreWorkflows: { edges: { node: WorkflowNode }[] };
    }>({ token: adminToken, query: LIST_WORKFLOWS });

    expect(errors).toBeUndefined();

    return data!.coreWorkflows.edges
      .map(({ node }) => node)
      .filter(({ isSystem }) => isSystem);
  };

  beforeAll(async () => {
    ({ restore: restoreRoles } = await assignSeededRoles([
      { email: SEEDED_MANAGER_EMAIL, roleLabel: 'Sales Manager' },
    ]));
    managerToken = await signIn(SEEDED_MANAGER_EMAIL);
    adminToken = await signIn(SEEDED_ADMIN_EMAIL);
  });

  afterAll(async () => {
    await restoreRoles?.();
  });

  it('ships the two system workflows', async () => {
    expect(await listAsAdmin()).toHaveLength(2);
  });

  it('refuses a Sales Manager renaming or deleting them', async () => {
    const workflows = await listAsAdmin();

    for (const { id } of workflows) {
      const rename = await userRequest({
        token: managerToken,
        query: `mutation ($id: UUID!) {
          updateCoreWorkflow(input: { coreWorkflowId: $id, name: "Edited" }) { id }
        }`,
        variables: { id },
      });
      const remove = await userRequest({
        token: managerToken,
        query: `mutation ($id: UUID!) {
          deleteCoreWorkflows(input: { coreWorkflowIds: [$id] }) { __typename }
        }`,
        variables: { id },
      });

      expect(rename.errors?.[0]?.message).toMatch(/permission/i);
      expect(remove.errors?.[0]?.message).toMatch(/permission/i);
    }

    expect(
      (await listAsAdmin()).map(({ name }) => name).sort(),
    ).toEqual(workflows.map(({ name }) => name).sort());
  });
});
