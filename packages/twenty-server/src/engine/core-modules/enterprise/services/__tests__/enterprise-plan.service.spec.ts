/* @license Enterprise */

import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AppTokenEntity } from 'src/engine/core-modules/app-token/app-token.entity';
import { EnterprisePlanService } from 'src/engine/core-modules/enterprise/services/enterprise-plan.service';
import { NodeEnvironment } from 'src/engine/core-modules/twenty-config/interfaces/node-environment.interface';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

describe('EnterprisePlanService', () => {
  const createService = async (nodeEnv: NodeEnvironment) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnterprisePlanService,
        {
          provide: TwentyConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'NODE_ENV' ? nodeEnv : undefined,
            ),
          },
        },
        {
          provide: getRepositoryToken(AppTokenEntity),
          useValue: { findOne: jest.fn().mockResolvedValue(null) },
        },
        { provide: getRepositoryToken(UserWorkspaceEntity), useValue: {} },
        { provide: getRepositoryToken(UserEntity), useValue: {} },
        { provide: getRepositoryToken(WorkspaceEntity), useValue: {} },
      ],
    }).compile();

    return module.get(EnterprisePlanService);
  };

  it.each([NodeEnvironment.DEVELOPMENT, NodeEnvironment.TEST])(
    'enables enterprise features without a validity token in %s',
    async (nodeEnv) => {
      const service = await createService(nodeEnv);

      expect(service.isValid()).toBe(true);
      expect(service.hasValidEnterpriseValidityToken()).toBe(true);
      expect(await service.isValidWithFreshToken()).toBe(true);
    },
  );

  it('keeps enterprise features disabled without a validity token in production', async () => {
    const service = await createService(NodeEnvironment.PRODUCTION);

    expect(service.isValid()).toBe(false);
    expect(service.hasValidEnterpriseValidityToken()).toBe(false);
    expect(await service.isValidWithFreshToken()).toBe(false);
  });
});
