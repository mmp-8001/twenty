import { NOT_ALLOWED_MESSAGE } from 'src/constants/admin-management.constant';
import { OFFER_NOT_AVAILABLE_MESSAGE } from 'src/constants/offer.constant';
import {
  listRecords,
  type RecordsClient,
  updateRecord,
  updateRecordsWhere,
} from 'src/logic-functions/utils/list-records.util';
import { writeAuditLog } from 'src/logic-functions/utils/write-audit-log.util';
import { type AdminRoleKey } from 'src/utils/admin-permissions.util';

// Voids the Offer for every User at once; no cancellation SMS. Used activations keep their history.
export const deactivateOffer = async ({
  client,
  callerId,
  callerRole,
  offerId,
  reason = null,
  now = new Date(),
}: {
  client: RecordsClient;
  callerId: string;
  callerRole: AdminRoleKey | null;
  offerId: string;
  reason?: string | null;
  now?: Date;
}): Promise<{ success: true; voidedCount: number } | { success: false; error: string }> => {
  if (callerRole !== 'FULL_ADMIN') {
    return { success: false, error: NOT_ALLOWED_MESSAGE };
  }

  const [offer] = await listRecords<{ status: string | null }>(client, 'offers', { id: { eq: offerId } }, {
    status: true,
  });

  if (!offer || offer.status !== 'ACTIVE') {
    return { success: false, error: OFFER_NOT_AVAILABLE_MESSAGE };
  }

  await updateRecord(client, 'Offer', offerId, {
    status: 'DEACTIVATED',
    deactivatedAt: now.toISOString(),
    deactivatedById: callerId,
  });

  const voided = await updateRecordsWhere(
    client,
    'offerActivations',
    { offerId: { eq: offerId }, status: { in: ['ACTIVE', 'ACTIVATION_FAILED'] } },
    { status: 'DEACTIVATED' },
  );

  await writeAuditLog({
    client,
    actorId: callerId,
    action: 'DEACTIVATE_OFFER',
    subjectType: 'offer',
    subjectId: offerId,
    reason,
    payload: { voidedCount: voided.length },
  });

  return { success: true, voidedCount: voided.length };
};
