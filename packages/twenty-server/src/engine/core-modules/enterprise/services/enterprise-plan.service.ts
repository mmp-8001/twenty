import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 } from 'uuid';

import { type EnterpriseLicenseInfo } from 'src/engine/core-modules/enterprise/types/organization-key-payload.type';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';

/**
 * Local development stub. All enterprise checks succeed without JWT verification
 * or external API calls. Billing URLs are unavailable. Seat counting uses the DB.
 * Replace the original service only in your local development checkout.
 */
@Injectable()
export class EnterprisePlanService implements OnModuleInit {
  private readonly logger = new Logger(EnterprisePlanService.name);
  private localServerId: string | null = null;

  static readonly ENTERPRISE_KEY_BOUND_TO_ANOTHER_SERVER_CODE =
    'ENTERPRISE_KEY_BOUND_TO_ANOTHER_SERVER';

  static readonly ENTERPRISE_VALIDITY_TOKEN_RATE_LIMITED_CODE =
    'ENTERPRISE_VALIDITY_TOKEN_RATE_LIMITED';

  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    @InjectRepository(UserWorkspaceEntity)
    private readonly userWorkspaceRepository: Repository<UserWorkspaceEntity>,
  ) {}

  async onModuleInit(): Promise<void> {}

  hasValidSignedEnterpriseKey(): boolean {
    return true;
  }

  hasValidEnterpriseValidityToken(): boolean {
    return true;
  }

  async isValidWithFreshToken(): Promise<boolean> {
    return true;
  }

  isValid(): boolean {
    return true;
  }

  isValidEnterpriseKeyFormat(_key: string): boolean {
    return true;
  }

  async getLicenseInfo(): Promise<EnterpriseLicenseInfo> {
    return {
      isValid: true,
      licensee: 'Local Development',
      expiresAt: new Date('2099-12-31T23:59:59Z'),
      subscriptionId: 'local-development',
    };
  }

  async setEnterpriseKey(_enterpriseKey: string): Promise<void> {}

  getLastRefreshRejectionCode(): string | null {
    return null;
  }

  async refreshValidityToken(): Promise<boolean> {
    return true;
  }

  // A user in multiple workspaces counts as one seat.
  async getBillableSeatCount(): Promise<number> {
    const result = await this.userWorkspaceRepository
      .createQueryBuilder('userWorkspace')
      .select('COUNT(DISTINCT "userWorkspace"."userId")', 'distinctUserCount')
      .where('"userWorkspace"."deletedAt" IS NULL')
      .getRawOne<{ distinctUserCount: string }>();

    return Math.max(1, Number(result?.distinctUserCount ?? 0));
  }

  async reportSeats(_seatCount: number): Promise<boolean> {
    return true;
  }

  async releaseServerBinding(): Promise<boolean> {
    return true;
  }

  async getSubscriptionStatus(): Promise<{
    status: string;
    licensee: string | null;
    expiresAt: Date | null;
    cancelAt: Date | null;
    currentPeriodEnd: Date | null;
    isCancellationScheduled: boolean;
  } | null> {
    return {
      status: 'active',
      licensee: 'Local Development',
      expiresAt: new Date('2099-12-31T23:59:59Z'),
      cancelAt: null,
      currentPeriodEnd: new Date('2099-12-31T23:59:59Z'),
      isCancellationScheduled: false,
    };
  }

  async getPortalUrl(_returnUrl?: string): Promise<string | null> {
    return null;
  }

  async getCheckoutUrl(
    _billingInterval: 'monthly' | 'yearly' = 'monthly',
    _seatCount: number,
  ): Promise<string | null> {
    return null;
  }

  async getOrCreateServerId(): Promise<string | null> {
    const existingServerId = this.twentyConfigService.get('SERVER_ID');

    if (typeof existingServerId === 'string' && existingServerId.length > 0) {
      return existingServerId;
    }

    // Retain a stable ID for this process even if DB config writes are disabled.
    this.localServerId ??= v4();

    try {
      await this.twentyConfigService.set('SERVER_ID', this.localServerId);
    } catch (error) {
      this.logger.warn(
        `Could not persist local SERVER_ID: ${error instanceof Error ? error.message : 'Unknown error'}. Using an in-memory ID.`,
      );
    }

    return this.localServerId;
  }
}
