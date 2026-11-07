import { useEffect, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';

import { MY_FOLLOWUPS_ROUTE_PATH } from 'src/constants/ownership.constant';
import { MY_FOLLOWUPS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { type MyFollowupRow } from 'src/logic-functions/utils/read-my-followups.util';
import {
  buildQueue,
  queueColour,
  type QueueColour,
  type QueueTab,
  summarizeQueue,
} from 'src/utils/build-queue.util';
import { formatTehranTime } from 'src/utils/format-tehran-time.util';

type QueueResponse = { success: boolean; error?: string; rows?: MyFollowupRow[] };

const COLOUR_HEX: Record<QueueColour, string> = { GREEN: '#2f9e44', YELLOW: '#f2b705', RED: '#e03131' };

const PURPOSE_LABEL = { REBUY: 'Rebuy user', RETENTION: 'Retention' } as const;

const formatProgress = ({ progress }: MyFollowupRow) => {
  if (progress.type === 'SCHEDULE') {
    return `Touch ${progress.touchNo ?? '-'} of 5 · Day ${progress.day} of 30`;
  }

  if (!progress.deadlineAt) {
    return '';
  }

  const msLeft = new Date(progress.deadlineAt).getTime() - Date.now();

  return `${Math.max(0, Math.ceil(msLeft / 86_400_000))} days left for the first call`;
};

const MyFollowups = () => {
  const [rows, setRows] = useState<MyFollowupRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<QueueTab>('TODAY');

  useEffect(() => {
    new RestApiClient().post<QueueResponse>(`/s${MY_FOLLOWUPS_ROUTE_PATH}`, {}).then(
      (result) => (result.success ? setRows(result.rows ?? []) : setError(result.error ?? 'Could not load')),
      () => setError('Could not load your follow-ups'),
    );
  }, []);

  const now = new Date();
  const summary = summarizeQueue(rows, now);
  const visibleRows = buildQueue({ rows, tab, now });

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        <span>Overdue: {summary.red}</span>
        <span>Due now: {summary.yellow}</span>
        <span>Today: {summary.today}</span>
        <span>All: {summary.all}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {(['TODAY', 'ALL'] as const).map((candidate) => (
          <button key={candidate} type="button" disabled={tab === candidate} onClick={() => setTab(candidate)}>
            {candidate === 'TODAY' ? 'Today' : 'All'}
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      <table style={{ width: '100%' }}>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.personId}>
              <td>
                <a href={`/object/person/${row.personId}`}>{row.name || 'User'}</a>
              </td>
              <td style={{ color: COLOUR_HEX[queueColour(new Date(row.nextCallAt), now)] }}>
                ● {formatTehranTime(row.nextCallAt)}
              </td>
              <td>
                {row.purpose.kind === 'CAMPAIGN'
                  ? (row.purpose.campaignName ?? 'Campaign')
                  : PURPOSE_LABEL[row.purpose.kind]}
              </td>
              <td>
                {row.platformStage ?? '-'} · {row.purchaseCount} purchases
              </td>
              <td>{formatProgress(row)}</td>
              <td>
                {row.lastCall
                  ? `${formatTehranTime(row.lastCall.startedAt)} · ${row.lastCall.technicalStatus.toLowerCase()} · ${row.lastCall.noteLine}`
                  : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: MY_FOLLOWUPS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'my-followups',
  description: 'The daily call queue: Today and All tabs, colours and summary counts.',
  component: MyFollowups,
});
