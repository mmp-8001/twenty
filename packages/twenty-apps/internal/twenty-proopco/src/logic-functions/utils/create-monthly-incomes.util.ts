import { monthBounds } from 'src/logic-functions/utils/commission-rules.util';
import {
  createRecord,
  listRecords,
  updateRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/list-records.util';

type CommissionNode = {
  ownerId: string | null;
  monthlyIncomeId: string | null;
  amount: { amountMicros: string | number | null } | null;
};

type MonthlyIncomeNode = { payoutStatus: string };

export const createMonthlyIncomes = async ({
  client,
  month,
}: {
  client: RecordsClient;
  month: string;
}): Promise<{ created: number; linked: number }> => {
  const { start, end } = monthBounds(month);
  const commissions = await listRecords<CommissionNode>(
    client,
    'commissions',
    {
      and: [{ createdAt: { gte: start } }, { createdAt: { lt: end } }],
    },
    {
      ownerId: true,
      monthlyIncomeId: true,
      amount: { amountMicros: true },
    },
  );
  const byAgent = new Map<string, CommissionNode[]>();

  for (const commission of commissions) {
    if (commission.ownerId) {
      byAgent.set(commission.ownerId, [
        ...(byAgent.get(commission.ownerId) ?? []),
        commission,
      ]);
    }
  }

  let created = 0;
  let linked = 0;

  for (const [agentId, agentCommissions] of byAgent) {
    const total = {
      amountMicros: agentCommissions.reduce(
        (sum, { amount }) => sum + Number(amount?.amountMicros ?? 0),
        0,
      ),
      currencyCode: 'USD',
    };
    let [monthlyIncome] = await listRecords<MonthlyIncomeNode & { id: string }>(
      client,
      'monthlyIncomes',
      { agentId: { eq: agentId }, month: { eq: month } },
      { payoutStatus: true },
    );

    if (!monthlyIncome) {
      const [member] = await listRecords<{
        name?: { firstName?: string; lastName?: string };
      }>(client, 'workspaceMembers', { id: { eq: agentId } }, {
        name: { firstName: true, lastName: true },
      });
      const memberName = [member?.name?.firstName, member?.name?.lastName]
        .filter(Boolean)
        .join(' ');
      const id = await createRecord(client, 'MonthlyIncome', {
        name: `${month} ${memberName}`.trim(),
        month,
        agentId,
        total,
        payoutStatus: 'PENDING',
      });

      monthlyIncome = { id, payoutStatus: 'PENDING' };
      created += 1;
    } else if (monthlyIncome.payoutStatus === 'PAID') {
      continue;
    } else {
      await updateRecord(client, 'MonthlyIncome', monthlyIncome.id, { total });
    }

    const monthlyIncomeId = monthlyIncome.id;
    const unlinked = (
      await listRecords<{ id: string }>(
        client,
        'commissions',
        {
          ownerId: { eq: agentId },
          monthlyIncomeId: { is: 'NULL' },
          and: [{ createdAt: { gte: start } }, { createdAt: { lt: end } }],
        },
        {},
      )
    );

    for (const { id } of unlinked) {
      await updateRecord(client, 'Commission', id, { monthlyIncomeId });
      linked += 1;
    }
  }

  return { created, linked };
};
