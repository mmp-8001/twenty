export const SEED_GERAMI_WORKSPACE_ID = '4b7e2f10-6a1c-4d3e-9f20-000000000001';
export const SEED_KIFPOOL_WORKSPACE_ID = '4b7e2f10-6a1c-4d3e-9f20-000000000002';
export const SEED_PROOPCO_WORKSPACE_ID = '4b7e2f10-6a1c-4d3e-9f20-000000000003';

export type BrandWorkspaceId =
  | typeof SEED_GERAMI_WORKSPACE_ID
  | typeof SEED_KIFPOOL_WORKSPACE_ID
  | typeof SEED_PROOPCO_WORKSPACE_ID;

export const BRAND_WORKSPACE_IDS: BrandWorkspaceId[] = [
  SEED_GERAMI_WORKSPACE_ID,
  SEED_KIFPOOL_WORKSPACE_ID,
  SEED_PROOPCO_WORKSPACE_ID,
];

export const isBrandWorkspaceId = (
  workspaceId: string,
): workspaceId is BrandWorkspaceId =>
  (BRAND_WORKSPACE_IDS as string[]).includes(workspaceId);
