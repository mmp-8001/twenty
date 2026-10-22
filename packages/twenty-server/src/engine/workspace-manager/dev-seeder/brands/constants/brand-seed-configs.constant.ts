import {
  type BrandWorkspaceId,
  SEED_GERAMI_WORKSPACE_ID,
  SEED_KIFPOOL_WORKSPACE_ID,
  SEED_PROOPCO_WORKSPACE_ID,
} from 'src/engine/workspace-manager/dev-seeder/brands/constants/brand-workspace-ids.constant';
import { GERAMI_BRAND_SEED_CONFIG } from 'src/engine/workspace-manager/dev-seeder/brands/gerami/gerami-brand-seed-config.constant';
import { KIFPOOL_BRAND_SEED_CONFIG } from 'src/engine/workspace-manager/dev-seeder/brands/kifpool/kifpool-brand-seed-config.constant';
import { PROOPCO_BRAND_SEED_CONFIG } from 'src/engine/workspace-manager/dev-seeder/brands/proopco/proopco-brand-seed-config.constant';
import { type BrandSeedConfig } from 'src/engine/workspace-manager/dev-seeder/brands/types/brand-seed-config.type';

export const BRAND_SEED_CONFIGS: Record<BrandWorkspaceId, BrandSeedConfig> = {
  [SEED_GERAMI_WORKSPACE_ID]: GERAMI_BRAND_SEED_CONFIG,
  [SEED_KIFPOOL_WORKSPACE_ID]: KIFPOOL_BRAND_SEED_CONFIG,
  [SEED_PROOPCO_WORKSPACE_ID]: PROOPCO_BRAND_SEED_CONFIG,
};
