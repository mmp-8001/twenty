import { randomUUID } from 'crypto';

import { isNonEmptyString } from '@sniptt/guards';

import {
  CAPABILITY_LABELS,
  DEACTIVATABLE_STATUSES,
  loadCode,
} from 'src/logic-functions/utils/code-activation.util';
import {
  PlatformError,
  type PlatformCapability,
  type PlatformClient,
} from 'src/logic-functions/utils/platform-client.util';
import {
  createRecord,
  listRecords,
  updateRecord,
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { isRefusalCode } from 'src/constants/refusal-codes.constant';
import { Refusal } from 'src/logic-functions/utils/refusal.util';

export type CreateDiscountCodeInput = {
  code?: string;
  capability?: string;
  expiresAt?: string;
  idempotencyKey?: string;
  inRebuySet?: boolean;
  inRetentionSet?: boolean;
};

const platformRefusal = (error: unknown) =>
  new Refusal(
    error instanceof PlatformError && error.status === 409 ? 409 : 502,
    error instanceof PlatformError && isRefusalCode(error.code) ? error.code : 'PLATFORM_ERROR',
    error instanceof Error ? error.message : 'The platform call failed.',
  );

// Platform first: a platform failure creates no row. The form sends one key per opened form, so a second click repeats the same create.
export const createDiscountCode = async (
  client: RecordsClient,
  platform: PlatformClient,
  input: CreateDiscountCodeInput,
  now: Date,
): Promise<{ id: string; platformCodeId: string }> => {
  const code = (input.code ?? '').trim();
  const expiresAt = new Date(input.expiresAt ?? '');

  if (code === '') {
    throw new Refusal(422, 'CODE_REQUIRED', 'Enter the code text.');
  }

  if (!isNonEmptyString(input.capability) || !(input.capability in CAPABILITY_LABELS)) {
    throw new Refusal(422, 'CAPABILITY_REQUIRED', 'Choose what the code does.');
  }

  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= now) {
    throw new Refusal(422, 'EXPIRY_INVALID', 'Choose an expiry in the future.');
  }

  if ((await listRecords(client, 'discountCodes', { code: { eq: code } }, {}, 1)).length > 0) {
    throw new Refusal(409, 'CODE_TAKEN', 'This code already exists.');
  }

  let platformCodeId: string;

  try {
    ({ platformCodeId } = await platform.createCode(
      {
        code,
        capability: input.capability.toLowerCase() as PlatformCapability,
        expiresAt: expiresAt.toISOString(),
      },
      input.idempotencyKey ?? randomUUID(),
    ));
  } catch (error) {
    throw platformRefusal(error);
  }

  const id = await createRecord(client, 'DiscountCode', {
    name: code,
    code,
    platformCodeId,
    capability: input.capability,
    expiresAt: expiresAt.toISOString(),
    isActive: true,
    inRebuySet: input.inRebuySet === true,
    inRetentionSet: input.inRetentionSet === true,
  });

  return { id, platformCodeId };
};

export const deactivateDiscountCode = async (
  client: RecordsClient,
  platform: PlatformClient,
  { codeId, actorName }: { codeId: string; actorName: string },
  now: Date,
): Promise<{ deactivatedActivations: number }> => {
  const code = await loadCode(client, codeId);

  if (!code.isActive) {
    throw new Refusal(409, 'ALREADY_DEACTIVATED', 'This code is already deactivated.');
  }

  try {
    await platform.deactivateCode(code.platformCodeId ?? '', randomUUID());
  } catch (error) {
    throw platformRefusal(error);
  }

  await updateRecord(client, 'DiscountCode', code.id, {
    isActive: false,
    deactivatedAt: now.toISOString(),
  });

  const changed = await updateRecordsWhere(
    client,
    'CodeActivations',
    { and: [{ codeId: { eq: code.id } }, { status: { in: DEACTIVATABLE_STATUSES } }] },
    { status: 'DEACTIVATED' },
  );

  await createRecord(client, 'AuditLog', {
    name: `Code deactivated · ${code.code}`,
    action: 'CODE_DEACTIVATED',
    status: 'DONE',
    occurredAt: now.toISOString(),
    effectiveAt: now.toISOString(),
    actorName,
    discountCodeId: code.id,
    details: { deactivatedActivations: changed.length },
  });

  return { deactivatedActivations: changed.length };
};
