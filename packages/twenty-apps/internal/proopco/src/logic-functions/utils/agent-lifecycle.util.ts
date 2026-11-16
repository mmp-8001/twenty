import { isString } from '@sniptt/guards';
import { isDefined } from 'twenty-sdk/utils';

import { DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  createAudit,
  type AuditContext,
} from 'src/logic-functions/utils/audit-log.util';
import {
  loadEligibilityPlan,
  recomputeAllEligibility,
} from 'src/logic-functions/utils/eligibility.util';
import { unfreezeAgent } from 'src/logic-functions/utils/freeze-agent.util';
import { loadMemberRoleIdentifiers } from 'src/logic-functions/utils/member-roles.util';
import {
  countRecords,
  listRecords,
  updateRecordsWhere,
} from 'src/logic-functions/utils/records.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';
import { type BulkCaller } from 'src/logic-functions/utils/transfer-contacts.util';

type LifecycleCaller = BulkCaller & { roles: string[]; agentId: string | null };

const loadAgent = async ({ client }: AuditContext, agentId: unknown) => {
  if (!isString(agentId)) {
    throw new Refusal(400, 'INVALID_BODY', 'agentId is required');
  }

  const [agent] = await listRecords<{ name: string; isActive: boolean; frozenSince: string | null }>(
    client,
    'agents',
    { id: { eq: agentId } },
    { name: true, isActive: true, frozenSince: true },
    1,
  );

  if (!isDefined(agent)) {
    throw new Refusal(404, 'AGENT_NOT_FOUND', 'Agent not found.');
  }

  return { agentId, ...agent };
};

const recomputeEligibility = async ({ client, metadata }: AuditContext) =>
  recomputeAllEligibility(client, await loadEligibilityPlan(client, metadata));

// Counts live contacts and open deals; rebuy windows are owned contacts too.
const ownedCount = async ({ client }: AuditContext, agentId: string) =>
  Math.max(
    await countRecords(client, 'people', { and: [{ ownerId: { eq: agentId } }, { deletedAt: { is: 'NULL' } }] }),
    await countRecords(client, 'opportunities', { and: [{ agentId: { eq: agentId } }, { openDealKey: { is: 'NOT_NULL' } }] }),
  );

export const deactivateAgent = async (
  context: AuditContext,
  { caller, agentId, now }: { caller: LifecycleCaller; agentId: unknown; now: Date },
) => {
  const agent = await loadAgent(context, agentId);

  if (!agent.isActive) {
    throw new Refusal(409, 'ALREADY_INACTIVE', 'This agent is already deactivated.');
  }

  // Deactivate first so no claim lands during the count; restore when the agent still owns work.
  const switched = await updateRecordsWhere(context.client, 'Agents', { and: [{ id: { eq: agent.agentId } }, { isActive: { eq: true } }] }, { isActive: false });

  if (switched.length === 0) {
    throw new Refusal(409, 'ALREADY_INACTIVE', 'This agent is already deactivated.');
  }

  const owned = await ownedCount(context, agent.agentId);

  if (owned > 0) {
    await updateRecordsWhere(context.client, 'Agents', { id: { eq: agent.agentId } }, { isActive: true });

    throw new Refusal(409, 'OWNS_CONTACTS', `Owns ${owned} contacts. Transfer or release them first.`);
  }

  if (isDefined(agent.frozenSince)) {
    await unfreezeAgent(context, { caller, agentId: agent.agentId, now });
  }

  await recomputeEligibility(context);
  await createAudit(
    context.client,
    { name: `Agent deactivated · ${agent.name}`, action: 'AGENT_DEACTIVATED', actor: caller, effectiveAt: now, links: { subjectAgentId: agent.agentId } },
    'DONE',
  );

  return { agentId: agent.agentId };
};

export const reactivateAgent = async (
  context: AuditContext,
  { caller, agentId, now }: { caller: LifecycleCaller; agentId: unknown; now: Date },
) => {
  const agent = await loadAgent(context, agentId);
  const switched = await updateRecordsWhere(context.client, 'Agents', { and: [{ id: { eq: agent.agentId } }, { isActive: { eq: false } }] }, { isActive: true });

  if (switched.length === 0) {
    throw new Refusal(409, 'ALREADY_ACTIVE', 'This agent is already active.');
  }

  await recomputeEligibility(context);
  await createAudit(
    context.client,
    { name: `Agent reactivated · ${agent.name}`, action: 'AGENT_REACTIVATED', actor: caller, effectiveAt: now, links: { subjectAgentId: agent.agentId } },
    'DONE',
  );

  return { agentId: agent.agentId };
};

// Nightly: an Agent whose role and status disagree is flagged once for a human to fix (apps cannot assign roles).
export const flagRoleMismatches = async (context: AuditContext, now: Date): Promise<number> => {
  const { client, metadata } = context;
  const agents = await listRecords<{ id: string; name: string; isActive: boolean }>(client, 'agents', {}, { name: true, isActive: true });
  const roles = await loadMemberRoleIdentifiers(metadata);
  let flagged = 0;

  for (const agent of agents) {
    const members = await listRecords<{ id: string }>(client, 'workspaceMembers', { agentId: { eq: agent.id } }, {});
    const hasDeactivatedRole = members.some(({ id }) => (roles.get(id) ?? []).includes(DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER));
    const reason = hasDeactivatedRole && agent.isActive
      ? 'Deactivated role but the agent is active'
      : !hasDeactivatedRole && !agent.isActive && members.length > 0
        ? 'Agent is deactivated but the role is not'
        : hasDeactivatedRole && (await ownedCount(context, agent.id)) > 0
          ? 'Deactivated role but the agent still owns contacts'
          : null;

    if (reason === null) {
      continue;
    }

    const open = await countRecords(client, 'auditLogs', {
      and: [{ subjectAgentId: { eq: agent.id } }, { needsReview: { eq: true } }, { reason: { eq: reason } }],
    });

    if (open === 0) {
      const auditId = await createAudit(
        client,
        {
          name: `Role mismatch · ${agent.name}`,
          action: agent.isActive ? 'AGENT_REACTIVATED' : 'AGENT_DEACTIVATED',
          actor: { memberId: null, name: 'System' },
          reason,
          effectiveAt: now,
          links: { subjectAgentId: agent.id },
        },
        'DONE',
      );

      await updateRecordsWhere(client, 'AuditLogs', { id: { eq: auditId } }, { needsReview: true });
      flagged += 1;
    }
  }

  return flagged;
};
