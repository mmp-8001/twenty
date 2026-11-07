import { COMMISSION_RATE_PERCENT, computeCommissionUsdt } from 'src/utils/commission.util';
import { decidePurchase } from 'src/logic-functions/utils/decide-purchase.util';
import {
  createRecord,
  listRecords,
  type RecordsClient,
  updateRecord,
} from 'src/logic-functions/utils/list-records.util';
import { recomputeVisibility } from 'src/logic-functions/utils/recompute-visibility.util';

type PaymentNode = {
  amountUsdt: number | null;
  paidAt: string | null;
  personId: string | null;
  challengeAccountId: string | null;
};

type CommissionNode = { paymentId: string | null };

// Runs after every Payment sync item, also an unchanged one, so a resend repairs a half-finished detection.
export const detectPurchase = async ({
  client,
  paymentProopcoId,
  now = new Date(),
}: {
  client: RecordsClient;
  paymentProopcoId: string;
  now?: Date;
}): Promise<void> => {
  const [payment] = await listRecords<PaymentNode & { id: string }>(
    client,
    'payments',
    { proopcoId: { eq: paymentProopcoId } },
    { amountUsdt: true, paidAt: true, personId: true, challengeAccountId: true },
  );

  if (!payment?.personId || !payment.challengeAccountId) {
    return;
  }

  const personId = payment.personId;
  const [ownership] = await listRecords<{
    id: string;
    state: string | null;
    adminId: string | null;
    startedAt: string | null;
  }>(client, 'ownerships', { openUserKey: { eq: personId } }, { state: true, adminId: true, startedAt: true });

  // A payment settled before the Ownership began is not attributed to it.
  if (!ownership || (payment.paidAt && ownership.startedAt && payment.paidAt < ownership.startedAt)) {
    return;
  }

  const [followup] = await listRecords<{ id: string; kind: string | null }>(
    client,
    'followups',
    { openKey: { eq: personId } },
    { kind: true },
  );
  const decision = decidePurchase({ ownershipState: ownership.state, followupKind: followup?.kind ?? null });

  if (decision.type === 'NOTHING') {
    return;
  }

  const closedAt = now.toISOString();

  if (decision.type === 'PURCHASE_BEFORE_CALL') {
    if (followup) {
      await updateRecord(client, 'Followup', followup.id, {
        status: 'PURCHASE_BEFORE_CALL',
        closedAt,
        openKey: null,
      });
    }

    await updateRecord(client, 'Ownership', ownership.id, {
      endedAt: closedAt,
      endReason: 'PURCHASE_BEFORE_CALL',
      openUserKey: null,
    });
    await updateRecord(client, 'Person', personId, { currentOwnerId: null });
    await recomputeVisibility({ client, personIds: [personId], now });

    return;
  }

  const [existing] = await listRecords<CommissionNode>(
    client,
    'commissions',
    { accountKey: { eq: payment.challengeAccountId } },
    { paymentId: true },
  );

  // Another payment already paid this account (COM-03).
  if (existing && existing.paymentId !== payment.id) {
    return;
  }

  if (!existing) {
    const amountUsdt = payment.amountUsdt ?? 0;

    try {
      await createRecord(client, 'Commission', {
        accountKey: payment.challengeAccountId,
        challengeAccountId: payment.challengeAccountId,
        adminId: ownership.adminId,
        personId,
        ownershipId: ownership.id,
        followupId: decision.type === 'SUCCESS' ? (followup?.id ?? null) : null,
        kind: decision.commissionKind,
        paymentId: payment.id,
        amountUsdt,
        rate: COMMISSION_RATE_PERCENT,
        commissionUsdt: computeCommissionUsdt(amountUsdt),
        purchasedAt: payment.paidAt ?? now.toISOString(),
      });
    } catch (error) {
      // A concurrent sync won the unique account key.
      const [winner] = await listRecords<CommissionNode>(
        client,
        'commissions',
        { accountKey: { eq: payment.challengeAccountId } },
        { paymentId: true },
      );

      if (winner) {
        return;
      }

      throw error;
    }
  }

  if (decision.type === 'SUCCESS') {
    if (followup) {
      await updateRecord(client, 'Followup', followup.id, {
        status: 'SUCCESSFUL',
        closedAt,
        openKey: null,
      });
    }

    await updateRecord(client, 'Ownership', ownership.id, { state: 'SUCCESSFUL' });
  }
};
