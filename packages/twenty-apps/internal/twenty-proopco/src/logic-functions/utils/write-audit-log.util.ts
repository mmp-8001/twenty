import { type AuditAction } from 'src/constants/admin-management.constant';
import { createRecord, type RecordsClient } from 'src/logic-functions/utils/list-records.util';

export const writeAuditLog = ({
  client,
  actorId,
  action,
  subjectType,
  subjectId,
  reason = null,
  payload = null,
}: {
  client: RecordsClient;
  actorId: string | null;
  action: AuditAction;
  subjectType: string;
  subjectId: string;
  reason?: string | null;
  payload?: Record<string, unknown> | null;
}) =>
  createRecord(client, 'AuditLog', { actorId, action, subjectType, subjectId, reason, payload });
