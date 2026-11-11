import {
  formatJalaliMonth,
  jalaliPartsOf,
  previousJalaliMonth,
} from 'src/utils/jalali.util';

export type RollupPurchase = {
  id: string;
  occurredAt: string;
  commissionUsdt: number | null;
  creditedAgentId: string | null;
  creditedAgentMemberId: string | null;
};

export type IncomeGroup = {
  agentId: string;
  agentMemberId: string | null;
  jalaliMonth: string;
  purchaseIds: string[];
};

const monthIndex = (jalaliMonth: string) => {
  const [year, month] = jalaliMonth.split('-').map(Number);

  return year * 12 + month;
};

const nextMonth = (jalaliMonth: string) => {
  const [year, month] = jalaliMonth.split('-').map(Number);

  return formatJalaliMonth(month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 });
};

// A purchase lands in the income of max(its own month, the first month not yet rolled up),
// so a closed month never changes after the marker passed it.
export const planMonthlyIncomes = (
  purchases: RollupPurchase[],
  marker: string | null,
  now: Date,
): { marker: string | null; groups: IncomeGroup[] } => {
  const lastClosed = formatJalaliMonth(previousJalaliMonth(now));

  if (marker !== null && monthIndex(marker) >= monthIndex(lastClosed)) {
    return { marker, groups: [] };
  }

  const groups = new Map<string, IncomeGroup>();

  for (const purchase of purchases) {
    if (purchase.creditedAgentId === null || (purchase.commissionUsdt ?? 0) <= 0) {
      continue;
    }

    const own = formatJalaliMonth(jalaliPartsOf(new Date(purchase.occurredAt)));
    const effective = marker !== null && monthIndex(own) <= monthIndex(marker) ? nextMonth(marker) : own;

    if (monthIndex(effective) > monthIndex(lastClosed)) {
      continue;
    }

    const key = `${purchase.creditedAgentId}|${effective}`;
    const group = groups.get(key) ?? {
      agentId: purchase.creditedAgentId,
      agentMemberId: purchase.creditedAgentMemberId,
      jalaliMonth: effective,
      purchaseIds: [],
    };

    group.purchaseIds.push(purchase.id);
    groups.set(key, group);
  }

  return {
    marker: lastClosed,
    groups: [...groups.values()].sort(
      (left, right) => monthIndex(left.jalaliMonth) - monthIndex(right.jalaliMonth),
    ),
  };
};
