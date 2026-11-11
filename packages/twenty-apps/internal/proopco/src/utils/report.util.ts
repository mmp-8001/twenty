import { DAY_MS } from 'src/constants/time.constant';
import { jalaliMonthStart, jalaliPartsOf } from 'src/utils/jalali.util';
import { startOfTehranDay } from 'src/utils/tehran-day.util';

export type ReportPeriodKind = 'DAY' | 'WEEK' | 'MONTH' | 'ALL';

const DAYS_PER_WEEK = 7;
// 1970-01-01 was a Thursday, five days after a Saturday.
const SATURDAY_OFFSET_DAYS = 5;

export const reportPeriodOf = (
  kind: ReportPeriodKind,
  anchor: Date,
  offset: number,
): { start: Date; end: Date } => {
  if (kind === 'ALL') {
    return { start: new Date(0), end: new Date(8.64e15) };
  }

  const dayStart = startOfTehranDay(anchor);

  if (kind === 'DAY') {
    const start = new Date(dayStart.getTime() + offset * DAY_MS);

    return { start, end: new Date(start.getTime() + DAY_MS) };
  }

  if (kind === 'WEEK') {
    const dayIndex = Math.round(dayStart.getTime() / DAY_MS);
    const sinceSaturday = (dayIndex + SATURDAY_OFFSET_DAYS) % DAYS_PER_WEEK;
    const start = new Date(dayStart.getTime() + (offset * DAYS_PER_WEEK - sinceSaturday) * DAY_MS);

    return { start, end: new Date(start.getTime() + DAYS_PER_WEEK * DAY_MS) };
  }

  const { year, month } = jalaliPartsOf(anchor);
  const index = year * 12 + (month - 1) + offset;
  const bounds = (target: number) => jalaliMonthStart(Math.floor(target / 12), (target % 12) + 1);

  return { start: bounds(index), end: bounds(index + 1) };
};

export const conversionRate = (won: number, lost: number): number | null =>
  won + lost === 0 ? null : won / (won + lost);

type Rankable = { name: string; revenue: number; conversion: number | null };

export const compareByRank = (left: Rankable, right: Rankable): number =>
  right.revenue - left.revenue ||
  (right.conversion ?? -1) - (left.conversion ?? -1) ||
  left.name.localeCompare(right.name);

export type ReportCall = {
  agentId: string;
  answered: boolean;
  callKind: 'FOLLOW_UP' | 'RETENTION';
  wasOverdue: boolean;
  campaign: CampaignKey;
  reasons: string[];
};

// A call or purchase belongs to a source campaign row, or to the Rebuy / Retention rows after them.
export type CampaignKey = { kind: 'CAMPAIGN'; id: string; name: string } | { kind: 'REBUY' } | { kind: 'RETENTION' };

export type ReportClosedDeal = { agentId: string; dealStage: string; closeReason: string | null; slots: (string | null)[] };
export type ReportPurchase = { agentId: string; amountUsdt: number; commissionUsdt: number; campaign: CampaignKey };

export type ReportData = {
  calls: ReportCall[];
  dealsOpened: { agentId: string }[];
  dealsClosed: ReportClosedDeal[];
  purchases: ReportPurchase[];
  codesActivated: { agentId: string }[];
  codesUsed: { agentId: string }[];
};

export type ReportAgent = { id: string; name: string; workingDays: number; income: { totalUsdt: number; status: string } | null };

const countBy = <TItem>(items: TItem[], keyOf: (item: TItem) => string) => {
  const counts = new Map<string, number>();

  for (const item of items) {
    counts.set(keyOf(item), (counts.get(keyOf(item)) ?? 0) + 1);
  }

  return counts;
};

export const summarizeAgent = (agent: ReportAgent | null, data: ReportData) => {
  const answered = data.calls.filter((call) => call.answered).length;
  const won = data.dealsClosed.filter((deal) => deal.dealStage === 'WON').length;
  const lost = data.dealsClosed.filter((deal) => deal.dealStage === 'LOST').length;
  const slots = data.dealsClosed.flatMap((deal) => deal.slots);
  const done = slots.filter((slot) => slot === 'DONE').length;
  const missed = slots.filter((slot) => slot === 'MISSED').length;
  const workingDays = agent?.workingDays ?? null;

  return {
    calls: {
      total: data.calls.length,
      answered,
      unanswered: data.calls.length - answered,
      answerRate: data.calls.length === 0 ? null : answered / data.calls.length,
      followUp: data.calls.filter((call) => call.callKind === 'FOLLOW_UP').length,
      retention: data.calls.filter((call) => call.callKind === 'RETENTION').length,
      reds: data.calls.filter((call) => call.wasOverdue).length,
      perWorkingDay: workingDays === null || workingDays === 0 ? null : data.calls.length / workingDays,
    },
    deals: {
      added: data.dealsOpened.length,
      won,
      lost,
      byCloseReason: Object.fromEntries(
        countBy(
          data.dealsClosed.filter((deal) => deal.closeReason !== null),
          (deal) => deal.closeReason as string,
        ),
      ),
    },
    conversion: conversionRate(won, lost),
    revenue: data.purchases.reduce((sum, purchase) => sum + purchase.amountUsdt, 0),
    codes: { activated: data.codesActivated.length, used: data.codesUsed.length },
    adherence: { done, missed, rate: done + missed === 0 ? null : done / (done + missed) },
    commission: data.purchases.reduce((sum, purchase) => sum + purchase.commissionUsdt, 0),
    income: agent?.income ?? null,
    workingDays,
  };
};

export type AgentSummary = ReturnType<typeof summarizeAgent>;

const TOP_REASONS = 5;

const pick = (data: ReportData, agentIds: Set<string>): ReportData => ({
  calls: data.calls.filter(({ agentId }) => agentIds.has(agentId)),
  dealsOpened: data.dealsOpened.filter(({ agentId }) => agentIds.has(agentId)),
  dealsClosed: data.dealsClosed.filter(({ agentId }) => agentIds.has(agentId)),
  purchases: data.purchases.filter(({ agentId }) => agentIds.has(agentId)),
  codesActivated: data.codesActivated.filter(({ agentId }) => agentIds.has(agentId)),
  codesUsed: data.codesUsed.filter(({ agentId }) => agentIds.has(agentId)),
});

const campaignRows = (data: ReportData) => {
  const rows = new Map<string, { label: string | null; kind: CampaignKey['kind']; calls: number; revenue: number; order: number }>();
  const row = (campaign: CampaignKey) => {
    const key = campaign.kind === 'CAMPAIGN' ? campaign.id : campaign.kind;
    const existing = rows.get(key) ?? {
      label: campaign.kind === 'CAMPAIGN' ? campaign.name : null,
      kind: campaign.kind,
      calls: 0,
      revenue: 0,
      order: campaign.kind === 'CAMPAIGN' ? 0 : campaign.kind === 'REBUY' ? 1 : 2,
    };

    rows.set(key, existing);

    return existing;
  };

  for (const call of data.calls) {
    row(call.campaign).calls += 1;
  }

  for (const purchase of data.purchases) {
    row(purchase.campaign).revenue += purchase.amountUsdt;
  }

  return [...rows.values()].sort((left, right) => left.order - right.order || (left.label ?? '').localeCompare(right.label ?? ''));
};

// `withTeam: false` is the Agent view: one row, no overall, no rank.
export const buildReport = ({
  agents,
  data,
  withTeam,
  campaignAgentId,
}: {
  agents: ReportAgent[];
  data: ReportData;
  withTeam: boolean;
  campaignAgentId: string | null;
}) => {
  const summaries = agents.map((agent) => ({ agentId: agent.id, name: agent.name, ...summarizeAgent(agent, pick(data, new Set([agent.id]))) }));
  const ranked = withTeam
    ? [...summaries]
        .sort((left, right) =>
          compareByRank(
            { name: left.name, revenue: left.revenue, conversion: left.conversion },
            { name: right.name, revenue: right.revenue, conversion: right.conversion },
          ),
        )
        .map((summary, index) => ({ ...summary, rank: index + 1 }))
    : summaries.map((summary) => ({ ...summary, rank: null }));
  const scope = new Set(campaignAgentId === null ? agents.map(({ id }) => id) : [campaignAgentId]);
  const scoped = pick(data, scope);

  return {
    rows: ranked,
    overall: withTeam ? summarizeAgent(null, pick(data, new Set(agents.map(({ id }) => id)))) : null,
    campaigns: campaignRows(scoped),
    topReasons: [...countBy(scoped.calls.flatMap((call) => call.reasons), (reason) => reason)]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, TOP_REASONS)
      .map(([name, count]) => ({ name, count })),
  };
};
