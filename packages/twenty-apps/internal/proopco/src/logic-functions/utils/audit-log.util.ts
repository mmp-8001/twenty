import { type MetadataApiClient } from 'twenty-client-sdk/metadata';

import {
  createRecord,
  listRecords,
  updateRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

export type AuditContext = { client: RecordsClient; metadata: MetadataApiClient };

export type AuditAction =
  | 'TRANSFER'
  | 'RELEASE'
  | 'FREEZE'
  | 'UNFREEZE'
  | 'AGENT_DEACTIVATED'
  | 'AGENT_REACTIVATED'
  | 'NOTE_EDITED';

export type AuditRow = {
  id: string;
  action: AuditAction;
  status: string;
  occurredAt: string;
  effectiveAt: string;
  attempts: number;
  contactId: string | null;
  subjectAgentId: string | null;
  fromAgentId: string | null;
  toAgentId: string | null;
  closedDealId: string | null;
  newDealId: string | null;
  freezePeriodId: string | null;
  actorId: string | null;
  details: Record<string, unknown> | null;
};

export const AUDIT_SELECTION = {
  action: true,
  status: true,
  occurredAt: true,
  effectiveAt: true,
  attempts: true,
  contactId: true,
  subjectAgentId: true,
  fromAgentId: true,
  toAgentId: true,
  closedDealId: true,
  newDealId: true,
  freezePeriodId: true,
  actorId: true,
  details: true,
};

// The inputs that must survive a crash: executors read only these, never the live caller.
export type AuditInput = {
  name: string;
  action: AuditAction;
  actor: { memberId: string | null; name: string };
  reason?: string | null;
  effectiveAt: Date;
  links?: Partial<Record<'contactId' | 'subjectAgentId' | 'fromAgentId' | 'toAgentId' | 'callId', string | null>>;
  details?: Record<string, unknown>;
};

export const createAudit = (
  client: RecordsClient,
  { name, action, actor, reason, effectiveAt, links, details }: AuditInput,
  status: 'IN_PROGRESS' | 'DONE',
): Promise<string> =>
  createRecord(client, 'AuditLog', {
    name,
    action,
    status,
    occurredAt: effectiveAt.toISOString(),
    effectiveAt: effectiveAt.toISOString(),
    actorId: actor.memberId,
    actorName: actor.name,
    reason: reason ?? null,
    details: details ?? null,
    ...links,
  });

export const loadAudit = async (client: RecordsClient, id: string): Promise<AuditRow> => {
  const [row] = await listRecords<AuditRow>(client, 'auditLogs', { id: { eq: id } }, AUDIT_SELECTION, 1);

  return row;
};

// Executors abort (not retry) when the world no longer matches the frozen inputs.
export class AuditAbort extends Error {}

const IN_PROCESS_TRIES = 2;

export type AuditExecutor = (context: AuditContext, audit: AuditRow) => Promise<void>;

// Runs the idempotent executor; a crash leaves the row In progress with the error for the sweeper to resume.
export const runAudit = async (
  context: AuditContext,
  audit: AuditRow,
  executor: AuditExecutor,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  let current = audit;
  let lastError = '';

  for (let attempt = 0; attempt < IN_PROCESS_TRIES; attempt += 1) {
    try {
      await executor(context, current);
      await updateRecord(context.client, 'AuditLog', audit.id, { status: 'DONE', lastError: null });

      return { ok: true };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);

      if (error instanceof AuditAbort) {
        await updateRecord(context.client, 'AuditLog', audit.id, { status: 'FAILED', lastError });

        return { ok: false, error: lastError };
      }

      current = await loadAudit(context.client, audit.id);
    }
  }

  await updateRecord(context.client, 'AuditLog', audit.id, {
    attempts: (audit.attempts ?? 0) + 1,
    lastError,
  });

  return { ok: false, error: lastError };
};
