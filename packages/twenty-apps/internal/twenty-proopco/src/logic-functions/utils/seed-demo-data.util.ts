import { type CoreApiClient } from 'twenty-client-sdk/core';

import { DEMO_PROOPCO_ID_PREFIX } from 'src/constants/demo-data.constant';
import {
  createRecord,
  readIds,
  type RecordsClient,
  updateRecord,
} from 'src/logic-functions/utils/list-records.util';
import { processProopcoSyncItem } from 'src/logic-functions/utils/process-proopco-sync-item.util';
import { removeDemoData } from 'src/logic-functions/utils/remove-demo-data.util';
import { buildActivationKey } from 'src/utils/offer-activation.util';
import { buildTouchWindows } from 'src/utils/call-windows.util';
import { computeCommissionUsdt } from 'src/utils/commission.util';
import { buildDemoSyncItems, DEMO_CASES, demoProopcoId, type DemoCase } from 'src/utils/demo-data.util';
import { jalaliMonthBounds, previousJalaliMonth } from 'src/utils/jalali.util';
import { buildIncomeKey, fromMicros, toMicros } from 'src/utils/monthly-income.util';
import { DAY_MS } from 'src/constants/time.constant';

type Members = { ownerA: string; ownerB: string };

const daysFrom = (now: Date, days: number) => new Date(now.getTime() + days * DAY_MS).toISOString();

const seedCase = async ({
  client,
  demoCase,
  members,
  now,
  personId,
  accountId,
  paymentId,
  incomeIdByAdmin,
  purchasedAt,
}: {
  client: RecordsClient;
  demoCase: DemoCase;
  members: Members;
  now: Date;
  personId: string;
  accountId: string;
  paymentId: string | null;
  incomeIdByAdmin: Map<string, string>;
  purchasedAt: Date;
}) => {
  const adminId = demoCase.owner === 'A' ? members.ownerA : members.ownerB;
  const isOpen = demoCase.endReason === null;
  const answeredAt =
    demoCase.firstAnsweredDaysAgo === null ? null : new Date(now.getTime() - demoCase.firstAnsweredDaysAgo * DAY_MS);
  const ownershipId = await createRecord(client, 'Ownership', {
    personId,
    adminId,
    state: demoCase.ownershipState,
    startedAt: new Date(now.getTime() - ((demoCase.firstAnsweredDaysAgo ?? 1) + 1) * DAY_MS).toISOString(),
    endedAt: isOpen ? null : now.toISOString(),
    endReason: demoCase.endReason,
    openUserKey: isOpen ? personId : null,
  });
  // A succeeded Ownership is open for retention, but its case is closed.
  const isCaseOpen = isOpen && demoCase.followupStatus !== 'SUCCESSFUL';
  const followupId = await createRecord(client, 'Followup', {
    personId,
    adminId,
    ownershipId,
    kind: demoCase.kind,
    status: demoCase.followupStatus,
    addedAt: new Date(now.getTime() - ((demoCase.firstAnsweredDaysAgo ?? 1) + 1) * DAY_MS).toISOString(),
    firstAnsweredCallAt: answeredAt?.toISOString() ?? null,
    deadlineAt: demoCase.deadlineInDays === null ? null : daysFrom(now, demoCase.deadlineInDays),
    frozenRemainingSeconds: null,
    closedAt: isCaseOpen ? null : now.toISOString(),
    openKey: isCaseOpen ? personId : null,
    ...(demoCase.followupStatus === 'TRANSFERRED' ? { transferredFrom: members.ownerB } : {}),
  });

  await updateRecord(client, 'Person', personId, {
    currentOwnerId: isOpen ? adminId : null,
    visibleToMemberIds: isOpen ? [adminId] : [],
  });

  let callId: string | null = null;

  if (answeredAt || demoCase.hasUnansweredCall) {
    callId = await createRecord(client, 'Call', {
      personId,
      adminId,
      visibleToMemberIds: [adminId],
      ownershipId,
      followupId,
      kind: 'FOLLOWUP',
      startedAt: (answeredAt ?? new Date(now.getTime() - DAY_MS)).toISOString(),
      technicalStatus: answeredAt ? 'ANSWERED' : 'NO_ANSWER',
      isAnswered: answeredAt !== null,
      note: `Demo call for ${demoCase.key}`,
      source: 'MANUAL',
    });
  }

  if (answeredAt && demoCase.followupStatus === 'IN_PROGRESS') {
    for (const window of buildTouchWindows(answeredAt)) {
      await createRecord(client, 'Touch', {
        followupId,
        adminId,
        touchNo: window.touchNo,
        windowStartAt: window.windowStartAt.toISOString(),
        windowEndAt: window.windowEndAt.toISOString(),
        status: window.touchNo === 1 ? 'DONE' : 'OPEN',
        completedCallId: window.touchNo === 1 ? callId : null,
      });
    }
  }

  if (demoCase.commissionAmountUsdt && paymentId) {
    await createRecord(client, 'Commission', {
      accountKey: demoProopcoId(`account-${demoCase.key}`),
      kind: demoCase.kind === 'REBUY' ? 'REBUY_SUCCESS' : 'CAMPAIGN_SUCCESS',
      amountUsdt: demoCase.commissionAmountUsdt,
      rate: 2,
      commissionUsdt: computeCommissionUsdt(demoCase.commissionAmountUsdt),
      purchasedAt: purchasedAt.toISOString(),
      ownershipId,
      followupId,
      personId,
      adminId,
      challengeAccountId: accountId,
      paymentId,
      monthlyIncomeId: incomeIdByAdmin.get(adminId) ?? null,
    });
  }

  return { ownershipId, followupId, callId, adminId };
};

// Seeds through the real sync contract, then writes the sales-process state directly. Every key carries
// the demo prefix; a second run does nothing, and a half-finished earlier run is removed first.
export const seedDemoData = async ({
  client,
  members,
  callerId,
  now = new Date(),
}: {
  client: RecordsClient;
  members: Members;
  callerId: string;
  now?: Date;
}): Promise<{ seeded: boolean }> => {
  const likeDemo = { like: `${DEMO_PROOPCO_ID_PREFIX}%` };

  if ((await readIds(client, 'monthlyIncomes', { incomeKey: likeDemo })).length > 0) {
    return { seeded: false };
  }

  if ((await readIds(client, 'people', { proopcoId: likeDemo })).length > 0) {
    await removeDemoData({ client });
  }

  const cases = DEMO_CASES;
  const { year, month } = previousJalaliMonth(now);
  const purchasedAt = new Date(jalaliMonthBounds(year, month).start.getTime() + 5 * DAY_MS);
  const syncClient = client as unknown as Pick<CoreApiClient, 'query' | 'mutation'>;

  for (const demoCase of cases) {
    for (const item of buildDemoSyncItems(demoCase, purchasedAt)) {
      const result = await processProopcoSyncItem(syncClient, item);

      if (result.status === 'error') {
        throw new Error(`Demo sync of ${item.proopcoId} failed: ${result.reason}`);
      }
    }
  }

  // Past-month incomes under a demo key, so the real rollup never touches or reuses them.
  const incomeIdByAdmin = new Map<string, string>();
  const incomeDrafts = [
    { adminId: members.ownerA, status: 'PAID' },
    { adminId: members.ownerB, status: 'PENDING' },
  ].filter(({ adminId }, index, all) => all.findIndex((draft) => draft.adminId === adminId) === index);

  for (const { adminId, status } of incomeDrafts) {
    incomeIdByAdmin.set(
      adminId,
      await createRecord(client, 'MonthlyIncome', {
        incomeKey: `${DEMO_PROOPCO_ID_PREFIX}${buildIncomeKey(adminId, year, month)}`,
        adminId,
        jalaliYear: year,
        jalaliMonth: month,
        totalUsdt: 0,
        status,
        ...(status === 'PAID' ? { paidAt: now.toISOString(), paidById: callerId } : {}),
      }),
    );
  }

  const offerId = await createRecord(client, 'Offer', {
    title: `${DEMO_PROOPCO_ID_PREFIX}offer`,
    capability: 'DISCOUNT',
    discountParams: { percent: 10 },
    expiresAt: daysFrom(now, 30),
    status: 'ACTIVE',
  });
  const totalMicrosByIncome = new Map<string, number>();

  for (const demoCase of cases) {
    const [personId] = await readIds(client, 'people', { proopcoId: { eq: demoProopcoId(`user-${demoCase.key}`) } });
    const [accountId] = await readIds(client, 'challengeAccounts', {
      proopcoId: { eq: demoProopcoId(`account-${demoCase.key}`) },
    });
    const [paymentId = null] = await readIds(client, 'payments', {
      proopcoId: { eq: demoProopcoId(`payment-${demoCase.key}`) },
    });
    const { adminId, callId } = await seedCase({
      client,
      demoCase,
      members,
      now,
      personId,
      accountId,
      paymentId,
      incomeIdByAdmin,
      purchasedAt,
    });
    const incomeId = incomeIdByAdmin.get(adminId);

    if (demoCase.commissionAmountUsdt && incomeId) {
      totalMicrosByIncome.set(
        incomeId,
        (totalMicrosByIncome.get(incomeId) ?? 0) + toMicros(computeCommissionUsdt(demoCase.commissionAmountUsdt)),
      );
    }

    if (['progress', 'success'].includes(demoCase.key)) {
      const isUsed = demoCase.key === 'success';

      await createRecord(client, 'OfferActivation', {
        activationKey: buildActivationKey(offerId, personId),
        offerId,
        personId,
        adminId,
        callId,
        code: `DEMO-${demoCase.key.toUpperCase()}`,
        status: isUsed ? 'USED' : 'ACTIVE',
        smsStatus: 'SENT',
        smsSentAt: now.toISOString(),
        ...(isUsed ? { usedAt: now.toISOString(), usedAccount: demoProopcoId(`account-${demoCase.key}`) } : {}),
      });
    }
  }

  for (const [incomeId, micros] of totalMicrosByIncome) {
    await updateRecord(client, 'MonthlyIncome', incomeId, { totalUsdt: fromMicros(micros) });
  }

  return { seeded: true };
};
