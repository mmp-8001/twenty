import { type CreateWorkspaceInput } from 'src/engine/workspace-manager/dev-seeder/core/constants/seeder-workspaces.constant';
import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';
import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

export type BrandRole = 'MANAGER' | 'SALES' | 'SUPPORT';

export type BrandMemberSeed = {
  userId: string;
  userWorkspaceId: string;
  workspaceMemberId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: BrandRole;
};

export type BrandFieldSeeds = {
  objectName: string;
  seeds: FieldMetadataSeed[];
};

// The inverse field name is derived from its label at creation, so it is
// created with an English label spelling `inverseName` and relabelled to
// `inverseLabel` after.
export type BrandRelationSeed = {
  objectName: string;
  name: string;
  label: string;
  icon: string;
  targetObjectName: string;
  inverseName: string;
  inverseLabel: string;
  inverseIcon: string;
};

export type BrandSeedConfig = {
  workspace: Omit<CreateWorkspaceInput, 'workspaceCustomApplicationId'>;
  members: BrandMemberSeed[];
  objects: ObjectMetadataSeed[];
  fields: BrandFieldSeeds[];
  relations: BrandRelationSeed[];
};
