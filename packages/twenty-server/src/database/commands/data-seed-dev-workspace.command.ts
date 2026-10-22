import { Logger } from '@nestjs/common';

import { Command, CommandRunner, Option } from 'nest-commander';

import {
  BRAND_WORKSPACE_IDS,
  isBrandWorkspaceId,
} from 'src/engine/workspace-manager/dev-seeder/brands/constants/brand-workspace-ids.constant';
import {
  SEED_APPLE_WORKSPACE_ID,
  SEED_YCOMBINATOR_WORKSPACE_ID,
  SeededWorkspacesIds,
} from 'src/engine/workspace-manager/dev-seeder/core/constants/seeder-workspaces.constant';
import { DevSeederService } from 'src/engine/workspace-manager/dev-seeder/services/dev-seeder.service';

type DataSeedWorkspaceOptions = {
  light?: boolean;
};

@Command({
  name: 'workspace:seed:dev',
  description:
    'Seed workspace with initial data. This command is intended for development only.',
})
export class DataSeedWorkspaceCommand extends CommandRunner {
  private readonly logger = new Logger(DataSeedWorkspaceCommand.name);

  constructor(private readonly devSeederService: DevSeederService) {
    super();
  }

  @Option({
    flags: '--light',
    description:
      'Light seed: only seed the Apple workspace (skip YCombinator), skip demo custom objects (Pet, Survey, etc.) and limit records to 5 per object',
  })
  parseLight(): boolean {
    return true;
  }

  async run(
    _passedParams: string[],
    options: DataSeedWorkspaceOptions,
  ): Promise<void> {
    const workspaceIds: SeededWorkspacesIds[] = options.light
      ? [SEED_APPLE_WORKSPACE_ID]
      : [
          SEED_APPLE_WORKSPACE_ID,
          SEED_YCOMBINATOR_WORKSPACE_ID,
          ...BRAND_WORKSPACE_IDS,
        ];

    for (const workspaceId of workspaceIds) {
      try {
        await this.devSeederService.seedDev(workspaceId, {
          light: options.light,
        });
      } catch (error) {
        // A broken brand seed must fail the reset instead of looking like a
        // successful one.
        if (isBrandWorkspaceId(workspaceId)) {
          throw error;
        }

        this.logger.error(error);
        this.logger.error(error.stack);

        return;
      }
    }
  }
}
