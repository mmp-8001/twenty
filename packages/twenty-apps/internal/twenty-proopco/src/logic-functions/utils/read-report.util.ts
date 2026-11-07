import { listRecords, type RecordsClient } from 'src/logic-functions/utils/list-records.util';
import { type ReportData, type ReportRange } from 'src/utils/build-report.util';

const CALL_ID_CHUNK = 100;

// One fetch per event table, scoped to an Admin or to the whole team; buildReport filters again by date.
export const readReportData = async ({
  client,
  adminId,
  range,
}: {
  client: RecordsClient;
  adminId: string | null;
  range: ReportRange;
}): Promise<ReportData> => {
  const adminFilter = adminId ? [{ adminId: { eq: adminId } }] : [];
  const inRange = (field: string) =>
    range.start
      ? { and: [{ [field]: { gte: range.start.toISOString() } }, { [field]: { lt: range.end.toISOString() } }] }
      : { [field]: { is: 'NOT_NULL' } };
  const filterOf = (...conditions: Record<string, unknown>[]) => ({ and: [...adminFilter, ...conditions] });

  const [calls, followups, commissions, activations, touches, freezes] = await Promise.all([
    listRecords<ReportData['calls'][number]>(client, 'calls', filterOf(inRange('startedAt')), {
      adminId: true,
      kind: true,
      isAnswered: true,
      startedAt: true,
    }),
    listRecords<ReportData['followups'][number]>(
      client,
      'followups',
      filterOf({ or: [inRange('addedAt'), inRange('closedAt')] }),
      { adminId: true, status: true, addedAt: true, closedAt: true, failureReason: { title: true } },
    ),
    listRecords<ReportData['commissions'][number]>(client, 'commissions', filterOf(inRange('purchasedAt')), {
      adminId: true,
      amountUsdt: true,
      commissionUsdt: true,
      purchasedAt: true,
    }),
    listRecords<ReportData['activations'][number]>(
      client,
      'offerActivations',
      filterOf({ or: [inRange('createdAt'), inRange('usedAt')] }),
      { adminId: true, status: true, createdAt: true, usedAt: true },
    ),
    listRecords<ReportData['touches'][number]>(client, 'touches', filterOf(inRange('windowEndAt')), {
      adminId: true,
      status: true,
      windowEndAt: true,
    }),
    listRecords<ReportData['freezes'][number]>(client, 'adminFreezes', filterOf(), {
      adminId: true,
      frozenAt: true,
      unfrozenAt: true,
    }),
  ]);
  const callReasons: ReportData['callReasons'] = [];

  for (let index = 0; index < calls.length; index += CALL_ID_CHUNK) {
    callReasons.push(
      ...(await listRecords<ReportData['callReasons'][number]>(
        client,
        'callFeedbackReasons',
        { callId: { in: calls.slice(index, index + CALL_ID_CHUNK).map(({ id }) => id) } },
        { callId: true, feedbackReason: { title: true } },
      )),
    );
  }

  return { calls, followups, commissions, activations, touches, freezes, callReasons };
};
