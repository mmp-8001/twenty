import {
  type BrandMemberSeed,
  type BrandRole,
} from 'src/engine/workspace-manager/dev-seeder/brands/types/brand-seed-config.type';
import { generateSeedId } from 'src/engine/workspace-manager/dev-seeder/core/utils/generate-seed-id.util';

export const buildBrandMemberSeeds = (
  workspaceId: string,
  emailDomain: string,
  members: [
    emailLocalPart: string,
    firstName: string,
    lastName: string,
    role: BrandRole,
  ][],
): BrandMemberSeed[] =>
  members.map(([emailLocalPart, firstName, lastName, role]) => ({
    userId: generateSeedId(workspaceId, `user-${emailLocalPart}`),
    userWorkspaceId: generateSeedId(
      workspaceId,
      `user-workspace-${emailLocalPart}`,
    ),
    workspaceMemberId: generateSeedId(
      workspaceId,
      `workspace-member-${emailLocalPart}`,
    ),
    firstName,
    lastName,
    email: `${emailLocalPart}@${emailDomain}`,
    role,
  }));
