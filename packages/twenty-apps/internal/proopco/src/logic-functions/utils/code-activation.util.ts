import { randomUUID } from 'crypto';

import { isDefined } from 'twenty-sdk/utils';

import { SETTINGS_DEFAULTS } from 'src/logic-functions/utils/ensure-settings.util';
import {
  platformErrorMessage,
  type PlatformClient,
} from 'src/logic-functions/utils/platform-client.util';
import {
  createRecord,
  listRecords,
  updateRecord,
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';
import { formatJalaliTehranDateTime } from 'src/utils/jalali.util';

// The SMS goes to Persian-speaking customers, so the labels are seed data, not UI strings.
export const CAPABILITY_LABELS: Record<string, string> = {
  DISCOUNT: 'تخفیف',
  RESET: 'بازنشانی',
  TWO_STEP_PAYMENT: 'پرداخت دو مرحله‌ای',
};

export const STALE_PENDING_MS = 5 * 60_000;
// Failed is the only state a human can retry; Used and Deactivated are final.
const DEACTIVATABLE_STATUSES = ['PENDING', 'ACTIVE', 'FAILED'];

export type CodeRow = {
  id: string;
  code: string;
  capability: string;
  expiresAt: string;
  isActive: boolean;
  platformCodeId: string | null;
};

export type ActivationRow = {
  id: string;
  status: string;
  smsStatus: string;
  codeId: string;
  contactId: string;
  activatingAgentId: string;
  contactOwnerId: string | null;
};

export type ActivationOutcome = {
  codeId: string;
  code: string;
  status: 'ACTIVE' | 'FAILED';
  smsStatus: 'SENT' | 'FAILED' | 'NOT_SENT';
  error: string | null;
};

export type OfferedCode = {
  id: string;
  code: string;
  capability: string;
  expiresAt: string;
  activated: boolean;
};

const CODE_SELECTION = { code: true, capability: true, expiresAt: true, isActive: true, platformCodeId: true };
const ACTIVATION_SELECTION = {
  status: true,
  smsStatus: true,
  codeId: true,
  contactId: true,
  activatingAgentId: true,
  contactOwnerId: true,
};

export const renderSmsTemplate = (
  template: string,
  { code, capability, expiresAt }: { code: string; capability: string; expiresAt: Date },
) =>
  template
    .split('{code}').join(code)
    .split('{capability}').join(CAPABILITY_LABELS[capability] ?? capability)
    .split('{expiry}').join(formatJalaliTehranDateTime(expiresAt));

export const assertCodeUsable = (code: Pick<CodeRow, 'isActive' | 'expiresAt'>, now: Date) => {
  if (!code.isActive) {
    throw new Refusal(409, 'CODE_DEACTIVATED', 'This code was deactivated.');
  }

  if (new Date(code.expiresAt) <= now) {
    throw new Refusal(409, 'CODE_EXPIRED', 'This code has expired.');
  }
};

export const loadCode = async (client: RecordsClient, codeId: string): Promise<CodeRow> => {
  const [code] = await listRecords<CodeRow>(client, 'discountCodes', { id: { eq: codeId } }, CODE_SELECTION, 1);

  if (!isDefined(code)) {
    throw new Refusal(404, 'CODE_NOT_FOUND', 'Code not found.');
  }

  return code;
};

// The codes the Log call form may offer for this contact's deal; activated ones stay listed but cannot be ticked.
export const loadOfferedCodes = async (
  client: RecordsClient,
  { kind, deal, personId, now }: {
    kind: 'FOLLOW_UP' | 'RETENTION';
    deal: { dealType: string; sourceCampaignId: string | null } | null;
    personId: string;
    now: Date;
  },
): Promise<OfferedCode[]> => {
  const usable = [{ isActive: { eq: true } }, { expiresAt: { gt: now.toISOString() } }];
  let setFilter: Record<string, unknown>;

  if (kind === 'RETENTION') {
    setFilter = { inRetentionSet: { eq: true } };
  } else if (deal?.dealType === 'REBUY') {
    setFilter = { inRebuySet: { eq: true } };
  } else if (isDefined(deal?.sourceCampaignId)) {
    const links = await listRecords<{ codeId: string }>(
      client,
      'campaignCodes',
      { campaignId: { eq: deal.sourceCampaignId } },
      { codeId: true },
    );

    if (links.length === 0) {
      return [];
    }

    setFilter = { id: { in: links.map(({ codeId }) => codeId) } };
  } else {
    return [];
  }

  const codes = await listRecords<CodeRow>(client, 'discountCodes', { and: [...usable, setFilter] }, CODE_SELECTION);

  if (codes.length === 0) {
    return [];
  }

  const activated = new Set(
    (
      await listRecords<{ codeId: string }>(
        client,
        'codeActivations',
        { and: [{ contactId: { eq: personId } }, { codeId: { in: codes.map(({ id }) => id) } }] },
        { codeId: true },
      )
    ).map(({ codeId }) => codeId),
  );

  return codes.map(({ id, code, capability, expiresAt }) => ({
    id,
    code,
    capability,
    expiresAt,
    activated: activated.has(id),
  }));
};

const loadSmsTemplate = async (client: RecordsClient) => {
  const [settings] = await listRecords<{ smsTemplate: string | null }>(
    client,
    'proopcoSettingsRecords',
    {},
    { smsTemplate: true },
    1,
  );

  return settings?.smsTemplate ?? SETTINGS_DEFAULTS.smsTemplate;
};

// A message per click: the platform dedupes by key, so each resend is a new message.
export const sendActivationSms = async (
  client: RecordsClient,
  platform: PlatformClient,
  activation: Pick<ActivationRow, 'id'>,
  code: CodeRow,
  platformUserId: string,
): Promise<'SENT' | 'FAILED'> => {
  try {
    await platform.sendSms(
      platformUserId,
      renderSmsTemplate(await loadSmsTemplate(client), {
        code: code.code,
        capability: code.capability,
        expiresAt: new Date(code.expiresAt),
      }),
      randomUUID(),
    );
    await updateRecord(client, 'CodeActivation', activation.id, { smsStatus: 'SENT' });

    return 'SENT';
  } catch (error) {
    await updateRecord(client, 'CodeActivation', activation.id, {
      smsStatus: 'FAILED',
      lastError: `SMS: ${platformErrorMessage(error)}`,
    });

    return 'FAILED';
  }
};

// The activation row id is the platform idempotency key, so a Retry repeats the same call safely.
const performActivation = async (
  client: RecordsClient,
  platform: PlatformClient,
  activation: ActivationRow,
  code: CodeRow,
  platformUserId: string,
  now: Date,
): Promise<ActivationOutcome> => {
  const outcome = { codeId: code.id, code: code.code };

  try {
    await platform.activateCode(code.platformCodeId ?? '', platformUserId, activation.id);
  } catch (error) {
    const message = platformErrorMessage(error);

    await updateRecord(client, 'CodeActivation', activation.id, { status: 'FAILED', lastError: message });

    return { ...outcome, status: 'FAILED', smsStatus: 'NOT_SENT', error: message };
  }

  await updateRecord(client, 'CodeActivation', activation.id, {
    status: 'ACTIVE',
    activatedAt: now.toISOString(),
    lastError: null,
  });

  const smsStatus = await sendActivationSms(client, platform, activation, code, platformUserId);

  return { ...outcome, status: 'ACTIVE', smsStatus, error: null };
};

const loadPlatformUserId = async (client: RecordsClient, personId: string) => {
  const [person] = await listRecords<{ platformUserId: string | null }>(
    client,
    'people',
    { id: { eq: personId } },
    { platformUserId: true },
    1,
  );

  return person?.platformUserId ?? '';
};

export const activateCodes = async (
  client: RecordsClient,
  platform: PlatformClient,
  {
    actor,
    person,
    callId,
    dealId,
    codeIds,
    now,
  }: {
    actor: { agentId: string; memberId: string };
    person: { id: string; displayName: string };
    callId: string;
    dealId: string | null;
    codeIds: string[];
    now: Date;
  },
): Promise<ActivationOutcome[]> => {
  const platformUserId = await loadPlatformUserId(client, person.id);
  const outcomes: ActivationOutcome[] = [];

  for (const codeId of codeIds) {
    const code = await loadCode(client, codeId);
    let activationId: string;

    try {
      activationId = await createRecord(client, 'CodeActivation', {
        name: `${code.code} · ${person.displayName}`,
        // One activation per code and contact, forever: the unique key makes a second insert fail.
        activationKey: `${code.id}:${person.id}`,
        codeId: code.id,
        contactId: person.id,
        activatingAgentId: actor.agentId,
        agentMemberId: actor.memberId,
        contactOwnerId: actor.agentId,
        contactOwnerMemberId: actor.memberId,
        callId,
        dealId,
        status: 'PENDING',
        smsStatus: 'NOT_SENT',
      });
    } catch (error) {
      const existing = await listRecords(client, 'codeActivations', { activationKey: { eq: `${code.id}:${person.id}` } }, {}, 1);

      if (existing.length === 0) {
        throw error;
      }

      continue;
    }

    outcomes.push(
      await performActivation(
        client,
        platform,
        {
          id: activationId,
          status: 'PENDING',
          smsStatus: 'NOT_SENT',
          codeId: code.id,
          contactId: person.id,
          activatingAgentId: actor.agentId,
          contactOwnerId: actor.agentId,
        },
        code,
        platformUserId,
        now,
      ),
    );
  }

  return outcomes;
};

export type ActivationCaller = { isStaff: boolean; agentId: string | null };

// Retry and Resend SMS: current owner, activating agent, Supervisor or Full Admin; the deal may be open or not.
export const loadActivationForCaller = async (
  client: RecordsClient,
  activationId: string,
  caller: ActivationCaller,
  now: Date,
) => {
  const [activation] = await listRecords<ActivationRow>(
    client,
    'codeActivations',
    { id: { eq: activationId } },
    ACTIVATION_SELECTION,
    1,
  );

  if (!isDefined(activation)) {
    throw new Refusal(404, 'ACTIVATION_NOT_FOUND', 'Code activation not found.');
  }

  const [person] = await listRecords<{ ownerId: string | null; lifecycleStage: string; platformUserId: string | null }>(
    client,
    'people',
    { id: { eq: activation.contactId } },
    { ownerId: true, lifecycleStage: true, platformUserId: true },
    1,
  );
  const allowed =
    caller.isStaff ||
    (isDefined(caller.agentId) &&
      (caller.agentId === activation.activatingAgentId || caller.agentId === person?.ownerId));

  if (!allowed) {
    throw new Refusal(403, 'NOT_ALLOWED', 'Only the owner, the activating agent or an admin can do this.');
  }

  const code = await loadCode(client, activation.codeId);

  assertCodeUsable(code, now);

  if (person?.lifecycleStage === 'DO_NOT_CONTACT') {
    throw new Refusal(422, 'CONTACT_DO_NOT_CONTACT', 'This contact is marked Do not contact.');
  }

  return { activation, code, platformUserId: person?.platformUserId ?? '' };
};

export const retryActivation = async (
  client: RecordsClient,
  platform: PlatformClient,
  activationId: string,
  caller: ActivationCaller,
  now: Date,
): Promise<ActivationOutcome> => {
  const { activation, code, platformUserId } = await loadActivationForCaller(client, activationId, caller, now);

  // Conditional so a double click cannot start two attempts.
  const claimed = await updateRecordsWhere(
    client,
    'CodeActivations',
    { and: [{ id: { eq: activation.id } }, { status: { eq: 'FAILED' } }] },
    { status: 'PENDING', lastError: null },
  );

  if (claimed.length === 0) {
    throw new Refusal(409, 'NOT_FAILED', 'Only a failed activation can be retried.');
  }

  return performActivation(client, platform, activation, code, platformUserId, now);
};

export const resendSms = async (
  client: RecordsClient,
  platform: PlatformClient,
  activationId: string,
  caller: ActivationCaller,
  now: Date,
): Promise<{ smsStatus: 'SENT' | 'FAILED' }> => {
  const { activation, code, platformUserId } = await loadActivationForCaller(client, activationId, caller, now);

  if (activation.status !== 'ACTIVE') {
    throw new Refusal(409, 'NOT_ACTIVE', 'An SMS is sent only for an active code.');
  }

  return { smsStatus: await sendActivationSms(client, platform, activation, code, platformUserId) };
};

// Step 6 of the sweeper: a call that never came back must not stay Pending forever.
export const failStalePendingActivations = async (client: RecordsClient, now: Date): Promise<number> =>
  (
    await updateRecordsWhere(
      client,
      'CodeActivations',
      {
        and: [
          { status: { eq: 'PENDING' } },
          { updatedAt: { lt: new Date(now.getTime() - STALE_PENDING_MS).toISOString() } },
        ],
      },
      { status: 'FAILED', lastError: 'The platform did not confirm in time.' },
    )
  ).length;

// purchase.settled with a code: the activation becomes Used whatever its status; credit stays with the activating agent.
export const linkUsedCode = async (
  client: RecordsClient,
  codeText: string,
  contactId: string,
  occurredAt: Date,
): Promise<string | null> => {
  const [code] = await listRecords<{ id: string }>(client, 'discountCodes', { code: { eq: codeText } }, {}, 1);

  if (!isDefined(code)) {
    return null;
  }

  await updateRecordsWhere(
    client,
    'CodeActivations',
    { and: [{ codeId: { eq: code.id } }, { contactId: { eq: contactId } }] },
    { status: 'USED', usedAt: occurredAt.toISOString() },
  );

  return code.id;
};

export { DEACTIVATABLE_STATUSES };
