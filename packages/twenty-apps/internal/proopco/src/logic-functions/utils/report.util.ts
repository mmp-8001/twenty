import { isDefined } from 'twenty-sdk/utils';

import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { countRecords, listRecords, type RecordsClient } from 'src/logic-functions/utils/records.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';
import { formatJalaliMonth, jalaliPartsOf } from 'src/utils/jalali.util';
import {
  buildReport,
  reportPeriodOf,
  type CampaignKey,
  type ReportAgent,
  type ReportData,
  type ReportPeriodKind,
} from 'src/utils/report.util';
import { workingDaysOf } from 'src/utils/working-days.util';

type DealRef = { dealType: string; sourceCampaignId: string | null } | null;

const campaignOf = (deal: DealRef, isRetention: boolean, campaignNames: Map<string, string>): CampaignKey => {
  if (isRetention || !isDefined(deal)) {
    return { kind: 'RETENTION' };
  }

  if (deal.dealType === 'REBUY') {
    return { kind: 'REBUY' };
  }

  const name = isDefined(deal.sourceCampaignId) ? campaignNames.get(deal.sourceCampaignId) : undefined;

  return isDefined(name) ? { kind: 'CAMPAIGN', id: deal.sourceCampaignId as string, name } : { kind: 'RETENTION' };
};

// The API returns a relation nested two levels deep (call -> deal -> campaign) as null, so names are loaded once on their own.
const DEAL_REF = { dealType: true, sourceCampaignId: true };
const PERIOD_KINDS = ['DAY', 'WEEK', 'MONTH', 'ALL'];

export type ReportCaller = { roles: string[]; memberAgentId: string | null };

// Scope is decided here, from the caller's role, and never from the request.
export const resolveReportScope = ({ roles, memberAgentId }: ReportCaller) => {
  const isStaff = [FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER, SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER].some((role) => roles.includes(role));

  if (roles.includes(DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER) || (!isStaff && !roles.includes(AGENT_ROLE_UNIVERSAL_IDENTIFIER))) {
    throw new Refusal(403, 'NO_ACCESS', 'You have no access to reports.');
  }

  if (!isStaff && !isDefined(memberAgentId)) {
    throw new Refusal(403, 'NO_AGENT', 'You have no agent record.');
  }

  return {
    isStaff,
    isFullAdmin: roles.includes(FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER),
    ownAgentId: isStaff ? null : (memberAgentId as string),
  };
};

export const loadReport = async (
  client: RecordsClient,
  { caller, body, now }: { caller: ReportCaller; body: Record<string, unknown> | null; now: Date },
) => {
  const scope = resolveReportScope(caller);
  const kind = (PERIOD_KINDS.includes(body?.period as string) ? body?.period : 'MONTH') as ReportPeriodKind;
  const offset = typeof body?.offset === 'number' && Number.isInteger(body.offset) ? Math.min(0, body.offset) : 0;
  const { start, end } = reportPeriodOf(kind, now, offset);
  const within = (field: string) => [{ [field]: { gte: start.toISOString() } }, { [field]: { lt: end.toISOString() } }];
  const requestedAgentId = scope.isStaff && typeof body?.agentId === 'string' && body.agentId !== 'ALL' ? body.agentId : null;

  const allAgents = await listRecords<{ id: string; name: string; createdAt: string }>(
    client,
    'agents',
    scope.isStaff ? {} : { id: { eq: scope.ownAgentId } },
    { name: true, createdAt: true },
  );
  const agentFilter = scope.isStaff ? {} : { agentId: { eq: scope.ownAgentId } };
  const [calls, dealsOpened, dealsClosed, purchases, activated, used, freezes, incomes, campaigns] = await Promise.all([
    listRecords<{ agentId: string; answered: boolean; callKind: 'FOLLOW_UP' | 'RETENTION'; wasOverdue: boolean; deal: DealRef; callReasons: { edges: { node: { reason: { name: string } | null } }[] } }>(
      client,
      'calls',
      { and: [...within('calledAt'), { agentId: { is: 'NOT_NULL' } }, agentFilter] },
      { agentId: true, answered: true, callKind: true, wasOverdue: true, deal: DEAL_REF, callReasons: { edges: { node: { reason: { name: true } } } } },
    ),
    listRecords<{ agentId: string }>(client, 'opportunities', { and: [...within('openedAt'), { agentId: { is: 'NOT_NULL' } }, agentFilter] }, { agentId: true }),
    listRecords<{ agentId: string; dealStage: string; closeReason: string | null } & Record<`slot${1 | 2 | 3 | 4 | 5}Status`, string | null>>(
      client,
      'opportunities',
      { and: [...within('closeDate'), { agentId: { is: 'NOT_NULL' } }, agentFilter] },
      { agentId: true, dealStage: true, closeReason: true, slot1Status: true, slot2Status: true, slot3Status: true, slot4Status: true, slot5Status: true },
    ),
    listRecords<{ creditedAgentId: string; amountUsdt: number | null; commissionUsdt: number | null; deal: DealRef }>(
      client,
      'purchases',
      { and: [...within('occurredAt'), { creditedAgentId: scope.isStaff ? { is: 'NOT_NULL' } : { eq: scope.ownAgentId } }] },
      { creditedAgentId: true, amountUsdt: true, commissionUsdt: true, deal: DEAL_REF },
    ),
    listRecords<{ activatingAgentId: string }>(client, 'codeActivations', { and: [...within('activatedAt'), { activatingAgentId: scope.isStaff ? { is: 'NOT_NULL' } : { eq: scope.ownAgentId } }] }, { activatingAgentId: true }),
    listRecords<{ activatingAgentId: string }>(client, 'codeActivations', { and: [...within('usedAt'), { activatingAgentId: scope.isStaff ? { is: 'NOT_NULL' } : { eq: scope.ownAgentId } }] }, { activatingAgentId: true }),
    listRecords<{ agentId: string; startedAt: string; endedAt: string | null }>(client, 'freezePeriods', agentFilter, { agentId: true, startedAt: true, endedAt: true }),
    kind === 'MONTH'
      ? listRecords<{ agentId: string; totalUsdt: number | null; status: string }>(
          client,
          'monthlyIncomes',
          { and: [{ jalaliMonth: { eq: formatJalaliMonth(jalaliPartsOf(new Date((start.getTime() + end.getTime()) / 2))) } }, agentFilter] },
          { agentId: true, totalUsdt: true, status: true },
        )
      : Promise.resolve([]),
    listRecords<{ id: string; name: string }>(client, 'campaigns', {}, { name: true }),
  ]);
  const campaignNames = new Map(campaigns.map(({ id, name }) => [id, name]));
  const periodEnd = new Date(Math.min(end.getTime(), now.getTime()));
  const agents: ReportAgent[] = allAgents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    workingDays: workingDaysOf({
      from: start,
      to: periodEnd,
      createdAt: new Date(agent.createdAt),
      freezes: freezes.filter(({ agentId }) => agentId === agent.id).map((freeze) => ({ startedAt: new Date(freeze.startedAt), endedAt: freeze.endedAt === null ? null : new Date(freeze.endedAt) })),
    }),
    income: (() => {
      const income = incomes.find(({ agentId }) => agentId === agent.id);

      return income ? { totalUsdt: income.totalUsdt ?? 0, status: income.status } : null;
    })(),
  }));
  const data: ReportData = {
    calls: calls.map((call) => ({
      agentId: call.agentId,
      answered: call.answered,
      callKind: call.callKind,
      wasOverdue: call.wasOverdue,
      campaign: campaignOf(call.deal, call.callKind === 'RETENTION', campaignNames),
      reasons: call.callReasons.edges.flatMap(({ node }) => (node.reason ? [node.reason.name] : [])),
    })),
    dealsOpened: dealsOpened.map(({ agentId }) => ({ agentId })),
    dealsClosed: dealsClosed.map((deal) => ({
      agentId: deal.agentId,
      dealStage: deal.dealStage,
      closeReason: deal.closeReason,
      slots: [deal.slot1Status, deal.slot2Status, deal.slot3Status, deal.slot4Status, deal.slot5Status],
    })),
    purchases: purchases.map((purchase) => ({
      agentId: purchase.creditedAgentId,
      amountUsdt: purchase.amountUsdt ?? 0,
      commissionUsdt: purchase.commissionUsdt ?? 0,
      campaign: campaignOf(purchase.deal, false, campaignNames),
    })),
    codesActivated: activated.map(({ activatingAgentId }) => ({ agentId: activatingAgentId })),
    codesUsed: used.map(({ activatingAgentId }) => ({ agentId: activatingAgentId })),
  };

  return {
    period: { kind, offset, start: start.toISOString(), end: end.toISOString() },
    ...buildReport({ agents, data, withTeam: scope.isStaff, campaignAgentId: scope.ownAgentId ?? requestedAgentId }),
    agents: scope.isStaff ? allAgents.map(({ id, name }) => ({ id, name })) : [],
    failedEvents: scope.isFullAdmin ? await countRecords(client, 'platformEventInboxes', { status: { eq: 'FAILED' } }) : null,
  };
};
