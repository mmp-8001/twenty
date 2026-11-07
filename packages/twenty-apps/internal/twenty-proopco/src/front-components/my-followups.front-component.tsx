import { useEffect, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import { msg, Trans, useTranslate } from 'twenty-sdk/front-component';

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
import { serverErrorLabel, translateValue } from 'src/utils/front-labels.util';
import { formatTehranTime } from 'src/utils/format-tehran-time.util';

type QueueResponse = { success: boolean; error?: string; rows?: MyFollowupRow[] };

const SERVER_ERRORS = [
  msg('Sign in required'),
  msg('Your account is frozen or deactivated'),
];

const CALL_STATUS_LABELS = {
  ANSWERED: msg({ message: 'Answered', context: 'call-status' }),
  NO_ANSWER: msg({ message: 'No answer', context: 'call-status' }),
  BUSY: msg({ message: 'Busy', context: 'call-status' }),
  SWITCHED_OFF: msg({ message: 'Switched off', context: 'call-status' }),
  REJECTED: msg({ message: 'Rejected', context: 'call-status' }),
  INVALID_NUMBER: msg({ message: 'Invalid number', context: 'call-status' }),
};

const COLOUR_HEX: Record<QueueColour, string> = { GREEN: '#2f9e44', YELLOW: '#f2b705', RED: '#e03131' };

const PURPOSE_LABEL = { REBUY: msg('Rebuy user'), RETENTION: msg('Retention') } as const;

const formatProgress = ({ progress }: MyFollowupRow, t: ReturnType<typeof useTranslate>['t']) => {
  if (progress.type === 'SCHEDULE') {
    return t('Touch {touchNo} of 5 · Day {day} of 30', { touchNo: progress.touchNo ?? '-', day: progress.day });
  }

  if (!progress.deadlineAt) {
    return '';
  }

  const msLeft = new Date(progress.deadlineAt).getTime() - Date.now();

  return t('{count} days left for the first call', { count: Math.max(0, Math.ceil(msLeft / 86_400_000)) });
};

const MyFollowups = () => {
  const { t } = useTranslate();
  const [rows, setRows] = useState<MyFollowupRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<QueueTab>('TODAY');

  useEffect(() => {
    new RestApiClient().post<QueueResponse>(`/s${MY_FOLLOWUPS_ROUTE_PATH}`, {}).then(
      (result) => (result.success ? setRows(result.rows ?? []) : setError(serverErrorLabel(result.error, t('Could not load'), SERVER_ERRORS, t))),
      () => setError(t('Could not load your follow-ups')),
    );
  }, []);

  const now = new Date();
  const summary = summarizeQueue(rows, now);
  const visibleRows = buildQueue({ rows, tab, now });

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        <span>{t('Overdue: {count}', { count: summary.red })}</span>
        <span>{t('Due now: {count}', { count: summary.yellow })}</span>
        <span>{t('Today: {count}', { count: summary.today })}</span>
        <span>{t('All: {count}', { count: summary.all })}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {(['TODAY', 'ALL'] as const).map((candidate) => (
          <button key={candidate} type="button" disabled={tab === candidate} onClick={() => setTab(candidate)}>
            {candidate === 'TODAY' ? <Trans context="queue-tab">Today</Trans> : <Trans context="queue-tab">All</Trans>}
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      <table style={{ width: '100%' }}>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={row.personId}>
              <td>
                <a href={`/object/person/${row.personId}`}>{row.name || t('User')}</a>
              </td>
              <td style={{ color: COLOUR_HEX[queueColour(new Date(row.nextCallAt), now)] }}>
                ● {formatTehranTime(row.nextCallAt)}
              </td>
              <td>
                {row.purpose.kind === 'CAMPAIGN'
                  ? (row.purpose.campaignName ?? t('Campaign'))
                  : t(PURPOSE_LABEL[row.purpose.kind])}
              </td>
              <td>
                {row.platformStage ?? '-'} · {t('{count} purchases', { count: row.purchaseCount })}
              </td>
              <td>{formatProgress(row, t)}</td>
              <td>
                {row.lastCall
                  ? `${formatTehranTime(row.lastCall.startedAt)} · ${translateValue(CALL_STATUS_LABELS, row.lastCall.technicalStatus, t)} · ${row.lastCall.noteLine}`
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
