import { randomUUID } from 'crypto';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { type AuditContext } from 'src/logic-functions/utils/audit-log.util';
import { markIncomesPaid, markIncomesUnpaid } from 'src/logic-functions/utils/income-paid.util';
import { rollUpMonthlyIncomes } from 'src/logic-functions/utils/monthly-income-rollup.util';
import { createRecord, listRecords, updateRecord } from 'src/logic-functions/utils/records.util';
import { loadReport } from 'src/logic-functions/utils/report.util';

import { createAgent, createCampaign, listMembers, softDelete } from './fixtures';

const client = new CoreApiClient();
const metadata = new MetadataApiClient();
const context: AuditContext = { client, metadata };
const JANE = 'jane.austen@apple.dev';

const created: { singular: string; id: string }[] = [];
let janeMemberId = '';
let settings: { id: string; lastRolledUpJalaliMonth: string | null };

const track = async (singular: string, id: Promise<string> | string) => {
  const resolved = await id;

  created.push({ singular, id: resolved });

  return resolved;
};

const newAgent = () => track('Agent', createAgent(client, `Agent ${randomUUID()}`));

const newPurchase = (agentId: string, occurredAt: string, amountUsdt: number, commissionUsdt: number, extra: Record<string, unknown> = {}) =>
  track(
    'Purchase',
    createRecord(client, 'Purchase', {
      name: 'test purchase',
      platformPurchaseId: `p_${randomUUID()}`,
      occurredAt,
      amountUsdt,
      commissionUsdt,
      creditedAgentId: agentId,
      ...extra,
    }),
  );

const incomesOf = (agentId: string) =>
  listRecords<{ id: string; jalaliMonth: string; totalUsdt: number; status: string; paidAt: string | null; paidById: string | null }>(
    client,
    'monthlyIncomes',
    { agentId: { eq: agentId } },
    { jalaliMonth: true, totalUsdt: true, status: true, paidAt: true, paidById: true },
  );

const auditsOfIncome = (monthlyIncomeId: string) =>
  listRecords<{ action: string; status: string; actorName: string }>(
    client,
    'auditLogs',
    { monthlyIncomeId: { eq: monthlyIncomeId } },
    { action: true, status: true, actorName: true },
  );

beforeAll(async () => {
  janeMemberId = (await listMembers(client)).find(({ userEmail }) => userEmail === JANE)!.id;
  [settings] = await listRecords<typeof settings>(client, 'proopcoSettingsRecords', {}, { lastRolledUpJalaliMonth: true }, 1);
});

afterEach(async () => {
  for (const agent of created.filter(({ singular }) => singular === 'Agent')) {
    for (const { id } of await incomesOf(agent.id)) {
      for (const audit of await listRecords<{ id: string }>(client, 'auditLogs', { monthlyIncomeId: { eq: id } }, {})) {
        created.push({ singular: 'AuditLog', id: audit.id });
      }

      created.push({ singular: 'MonthlyIncome', id });
    }
  }

  for (const { singular, id } of [...new Map(created.splice(0).map((entry) => [entry.id, entry])).values()].reverse()) {
    await softDelete(client, singular, id).catch(() => undefined);
  }

  await updateRecord(client, 'ProopcoSettings', settings.id, { lastRolledUpJalaliMonth: settings.lastRolledUpJalaliMonth });
});

afterAll(async () => {
  await updateRecord(client, 'ProopcoSettings', settings.id, { lastRolledUpJalaliMonth: settings.lastRolledUpJalaliMonth });
});

describe('monthly income (CS2)', () => {
  // 1 Azar 1404 01:00 in Tehran; Aban ran 2025-10-23 to 2025-11-21.
  const FIRST_OF_AZAR = new Date('2025-11-21T21:30:00Z');

  it('rolls Aban into an Awaiting payment record on 1 Azar, once, and a Full Admin pays and unpays it with audit rows', async () => {
    const agentA = await newAgent();
    const agentB = await newAgent();

    await updateRecord(client, 'ProopcoSettings', settings.id, { lastRolledUpJalaliMonth: '1404-07' });
    await newPurchase(agentA, '2025-10-25T10:00:00Z', 500, 10);
    await newPurchase(agentA, '2025-11-15T10:00:00Z', 500, 10);
    await newPurchase(agentB, '2025-11-01T10:00:00Z', 0, 0);

    await rollUpMonthlyIncomes(client, FIRST_OF_AZAR);

    const [income, ...others] = await incomesOf(agentA);

    expect(others).toEqual([]);
    expect(income).toMatchObject({ jalaliMonth: '1404-08', totalUsdt: 20, status: 'AWAITING_PAYMENT', paidAt: null });
    expect(await incomesOf(agentB)).toEqual([]);

    const [afterFirst] = await listRecords<{ lastRolledUpJalaliMonth: string }>(client, 'proopcoSettingsRecords', {}, { lastRolledUpJalaliMonth: true }, 1);

    expect(afterFirst.lastRolledUpJalaliMonth).toBe('1404-08');

    await rollUpMonthlyIncomes(client, new Date(FIRST_OF_AZAR.getTime() + 60_000));

    expect(await incomesOf(agentA)).toHaveLength(1);

    const caller = { memberId: janeMemberId, name: JANE };

    expect(await markIncomesPaid(context, { caller, incomeIds: [income.id], now: new Date() })).toEqual({ succeeded: [income.id], failed: [] });

    const [paid] = await incomesOf(agentA);

    expect(paid).toMatchObject({ status: 'PAID', paidById: janeMemberId });
    expect(paid.paidAt).not.toBeNull();
    expect((await markIncomesPaid(context, { caller, incomeIds: [income.id], now: new Date() })).failed[0].code).toBe('ALREADY_PAID');

    await markIncomesUnpaid(context, { caller, incomeIds: [income.id], now: new Date() });

    expect((await incomesOf(agentA))[0]).toMatchObject({ status: 'AWAITING_PAYMENT', paidAt: null, paidById: null });
    expect((await auditsOfIncome(income.id)).map(({ action, status }) => [action, status]).sort()).toEqual([
      ['INCOME_PAID', 'DONE'],
      ['INCOME_UNPAID', 'DONE'],
    ]);
  });

  it('recomputes the total of a rolled month on a rerun after a crash between linking and the total', async () => {
    const agent = await newAgent();

    await updateRecord(client, 'ProopcoSettings', settings.id, { lastRolledUpJalaliMonth: '1404-07' });
    await newPurchase(agent, '2025-11-15T10:00:00Z', 500, 10);
    await rollUpMonthlyIncomes(client, FIRST_OF_AZAR);

    const [income] = await incomesOf(agent);

    await updateRecord(client, 'MonthlyIncome', income.id, { totalUsdt: 0 });
    await updateRecord(client, 'ProopcoSettings', settings.id, { lastRolledUpJalaliMonth: '1404-07' });
    await rollUpMonthlyIncomes(client, FIRST_OF_AZAR);

    expect(await incomesOf(agent)).toMatchObject([{ jalaliMonth: '1404-08', totalUsdt: 10 }]);
  });

  it('moves a purchase that arrives after its month was rolled up into the next open month', async () => {
    const agent = await newAgent();

    await updateRecord(client, 'ProopcoSettings', settings.id, { lastRolledUpJalaliMonth: '1404-08' });
    await newPurchase(agent, '2025-11-15T10:00:00Z', 100, 2);
    await rollUpMonthlyIncomes(client, new Date('2025-12-21T21:30:00Z'));

    expect((await incomesOf(agent)).map(({ jalaliMonth, totalUsdt }) => [jalaliMonth, totalUsdt])).toEqual([['1404-09', 2]]);
  });
});

describe('reports (RS3, RS4)', () => {
  const inAban = new Date('2025-11-05T10:00:00Z');

  const scene = async () => {
    const agentK = await newAgent();
    const agentL = await newAgent();
    const campaignId = await track('Campaign', createCampaign(client, { startsAt: '2025-01-01' }));
    const personId = await track('Person', createRecord(client, 'Person', { name: { firstName: 'Rs', lastName: randomUUID().slice(0, 8) }, platformUserId: `u_${randomUUID()}` }));

    // Added 25 Mehr, answered call 28 Mehr, purchase and win 10 Aban.
    await track(
      'Opportunity',
      createRecord(client, 'Opportunity', {
        name: 'rs3',
        pointOfContactId: personId,
        dealType: 'CAMPAIGN',
        dealStage: 'WON',
        sourceCampaignId: campaignId,
        openedAt: '2025-10-17T10:00:00Z',
        deadlineAt: '2025-11-17T10:00:00Z',
        closeDate: '2025-11-01T10:00:00Z',
        agentId: agentK,
      }),
    );
    await track(
      'Call',
      createRecord(client, 'Call', {
        name: 'rs3 call',
        contactId: personId,
        agentId: agentK,
        calledAt: '2025-10-20T10:00:00Z',
        callKind: 'FOLLOW_UP',
        technicalStatus: 'ANSWERED',
        answered: true,
        idempotencyKey: randomUUID(),
      }),
    );
    await newPurchase(agentK, '2025-11-01T10:00:00Z', 100, 2);
    await newPurchase(agentL, '2025-11-02T10:00:00Z', 300, 6);

    return { agentK, agentL };
  };

  it('puts Added in Mehr and Successful and revenue in Aban (RS3)', async () => {
    const { agentK } = await scene();
    const caller = { roles: [SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER], memberAgentId: null };
    const rowOf = async (offset: number) =>
      (await loadReport(client, { caller, body: { period: 'MONTH', offset }, now: inAban })).rows.find(({ agentId }) => agentId === agentK)!;
    const aban = await rowOf(0);
    const mehr = await rowOf(-1);

    expect([mehr.deals.added, mehr.calls.answered, mehr.deals.won, mehr.revenue]).toEqual([1, 1, 0, 0]);
    expect([aban.deals.added, aban.calls.answered, aban.deals.won, aban.revenue, aban.conversion]).toEqual([0, 0, 1, 100, 1]);
  });

  it('shows an Agent only their own numbers, and staff everyone with names, ranks and the overall row (RS4)', async () => {
    const { agentK, agentL } = await scene();
    const own = await loadReport(client, { caller: { roles: [AGENT_ROLE_UNIVERSAL_IDENTIFIER], memberAgentId: agentK }, body: { period: 'MONTH' }, now: inAban });

    expect(own.rows.map(({ agentId, rank }) => [agentId, rank])).toEqual([[agentK, null]]);
    expect([own.overall, own.agents, own.failedEvents]).toEqual([null, [], null]);

    // Asking for someone else's agent does not widen an Agent's scope.
    const spoofed = await loadReport(client, { caller: { roles: [AGENT_ROLE_UNIVERSAL_IDENTIFIER], memberAgentId: agentK }, body: { period: 'MONTH', agentId: agentL }, now: inAban });

    expect(spoofed.rows.map(({ agentId }) => agentId)).toEqual([agentK]);

    const team = await loadReport(client, { caller: { roles: [SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER], memberAgentId: null }, body: { period: 'MONTH' }, now: inAban });
    const ranks = team.rows.filter(({ agentId }) => [agentK, agentL].includes(agentId));

    expect(ranks.map(({ agentId }) => agentId)).toEqual([agentL, agentK]);
    expect(ranks.every(({ rank, name }) => rank !== null && name.length > 0)).toBe(true);
    expect(team.overall).not.toBeNull();
    expect(team.failedEvents).toBeNull();

    const admin = await loadReport(client, { caller: { roles: [FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER], memberAgentId: null }, body: { period: 'MONTH' }, now: inAban });

    expect(typeof admin.failedEvents).toBe('number');
  });
});
