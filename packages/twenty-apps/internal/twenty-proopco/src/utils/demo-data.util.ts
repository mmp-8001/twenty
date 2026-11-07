import { type ProopcoSyncItem } from 'src/logic-functions/types/proopco-sync.type';
import { DEMO_PROOPCO_ID_PREFIX } from 'src/constants/demo-data.constant';

export type DemoOwnerSlot = 'A' | 'B' | 'FROZEN';

export type DemoCase = {
  key: string;
  followupStatus: string;
  kind: 'CAMPAIGN' | 'REBUY';
  ownershipState: string;
  // null keeps the Ownership open.
  endReason: string | null;
  owner: DemoOwnerSlot;
  // null: no call yet.
  firstAnsweredDaysAgo: number | null;
  hasUnansweredCall?: boolean;
  // Days from now; null for a closed or frozen case.
  deadlineInDays: number | null;
  // Amount of the one purchase that earns a Commission, if any.
  commissionAmountUsdt?: number;
  accountStatus?: string;
};

// Covers every case status and every Ownership state; the frozen case is skipped without a second member.
export const DEMO_CASES: DemoCase[] = [
  { key: 'pending', followupStatus: 'PENDING_FIRST_CALL', kind: 'CAMPAIGN', ownershipState: 'PENDING_FIRST_CALL', endReason: null, owner: 'A', firstAnsweredDaysAgo: null, deadlineInDays: 5 },
  { key: 'progress', followupStatus: 'IN_PROGRESS', kind: 'CAMPAIGN', ownershipState: 'IN_FOLLOWUP', endReason: null, owner: 'A', firstAnsweredDaysAgo: 3, deadlineInDays: 27 },
  { key: 'rebuy', followupStatus: 'REBUY_PENDING', kind: 'REBUY', ownershipState: 'REBUY_PENDING', endReason: null, owner: 'B', firstAnsweredDaysAgo: null, deadlineInDays: 3, accountStatus: 'breached' },
  { key: 'success', followupStatus: 'SUCCESSFUL', kind: 'CAMPAIGN', ownershipState: 'SUCCESSFUL', endReason: null, owner: 'A', firstAnsweredDaysAgo: 12, deadlineInDays: null, commissionAmountUsdt: 500 },
  { key: 'rebuy-success', followupStatus: 'SUCCESSFUL', kind: 'REBUY', ownershipState: 'SUCCESSFUL', endReason: null, owner: 'B', firstAnsweredDaysAgo: 9, deadlineInDays: null, commissionAmountUsdt: 250 },
  { key: 'expired', followupStatus: 'EXPIRED', kind: 'CAMPAIGN', ownershipState: 'IN_FOLLOWUP', endReason: 'EXPIRED', owner: 'B', firstAnsweredDaysAgo: 35, deadlineInDays: null },
  { key: 'failed', followupStatus: 'FAILED', kind: 'CAMPAIGN', ownershipState: 'IN_FOLLOWUP', endReason: 'FAILED', owner: 'A', firstAnsweredDaysAgo: 8, deadlineInDays: null },
  { key: 'no-answer', followupStatus: 'NO_ANSWER_FIRST_CALL', kind: 'CAMPAIGN', ownershipState: 'PENDING_FIRST_CALL', endReason: 'NO_ANSWER_7D', owner: 'B', firstAnsweredDaysAgo: null, hasUnansweredCall: true, deadlineInDays: null },
  { key: 'purchase-before-call', followupStatus: 'PURCHASE_BEFORE_CALL', kind: 'CAMPAIGN', ownershipState: 'PENDING_FIRST_CALL', endReason: 'PURCHASE_BEFORE_CALL', owner: 'A', firstAnsweredDaysAgo: null, deadlineInDays: null },
  { key: 'released-72h', followupStatus: 'RELEASED_72H', kind: 'REBUY', ownershipState: 'REBUY_PENDING', endReason: 'RELEASED_72H', owner: 'B', firstAnsweredDaysAgo: null, deadlineInDays: null },
  { key: 'transferred', followupStatus: 'TRANSFERRED', kind: 'CAMPAIGN', ownershipState: 'IN_FOLLOWUP', endReason: 'TRANSFERRED', owner: 'A', firstAnsweredDaysAgo: 5, deadlineInDays: null },
  { key: 'released-by-manager', followupStatus: 'RELEASED_BY_MANAGER', kind: 'CAMPAIGN', ownershipState: 'IN_FOLLOWUP', endReason: 'RELEASED_BY_MANAGER', owner: 'B', firstAnsweredDaysAgo: 4, deadlineInDays: null },
  { key: 'frozen', followupStatus: 'IN_PROGRESS', kind: 'CAMPAIGN', ownershipState: 'IN_FOLLOWUP', endReason: null, owner: 'FROZEN', firstAnsweredDaysAgo: 2, deadlineInDays: null },
];

export const demoProopcoId = (key: string) => `${DEMO_PROOPCO_ID_PREFIX}${key}`;

export const isDemoKey = (value: string | null | undefined) =>
  value?.startsWith(DEMO_PROOPCO_ID_PREFIX) === true;

// What the proopco sync would carry for one demo user: the user, an account and, for a purchase, a payment.
export const buildDemoSyncItems = (demoCase: DemoCase, purchasedAt: Date): ProopcoSyncItem[] => {
  const userProopcoId = demoProopcoId(`user-${demoCase.key}`);
  const accountProopcoId = demoProopcoId(`account-${demoCase.key}`);

  return [
    {
      type: 'user' as const,
      proopcoId: userProopcoId,
      data: {
        firstName: `Demo ${demoCase.key}`,
        lastName: 'User',
        email: `${demoProopcoId(demoCase.key)}@example.com`,
        signedUpAt: new Date(purchasedAt.getTime() - 40 * 86_400_000).toISOString(),
        kycStatus: 'APPROVED',
      },
    },
    {
      type: 'account' as const,
      proopcoId: accountProopcoId,
      data: { userProopcoId, status: demoCase.accountStatus ?? 'active', phase: 'Phase 1' },
    },
    ...(demoCase.commissionAmountUsdt
      ? [
          {
            type: 'payment' as const,
            proopcoId: demoProopcoId(`payment-${demoCase.key}`),
            data: {
              userProopcoId,
              accountProopcoId,
              amountToman: demoCase.commissionAmountUsdt * 60_000,
              amountUsdt: demoCase.commissionAmountUsdt,
              paidAt: purchasedAt.toISOString(),
            },
          },
        ]
      : []),
  ];
};
