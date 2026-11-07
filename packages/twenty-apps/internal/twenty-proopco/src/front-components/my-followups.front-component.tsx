import { useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import { msg, Trans, useTranslate } from 'twenty-sdk/front-component';

import { IconCheckbox } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/primitives/data-display';
import { Tabs } from 'twenty-ui/primitives/navigation';

import {
  Cell,
  HeaderCell,
  MutedText,
  NameLink,
  NumericValue,
  Page,
  Row,
  StatCard,
  StatGrid,
  StatValue,
  Table,
  TableWrapper,
} from 'src/front-components/components/layout';
import { EmptyState, ErrorCallout, LoadingState } from 'src/front-components/components/state-views';
import { MY_FOLLOWUPS_ROUTE_PATH } from 'src/constants/ownership.constant';
import { MY_FOLLOWUPS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { type MyFollowupRow } from 'src/logic-functions/utils/read-my-followups.util';
import {
  buildQueue,
  type QueueTab,
  summarizeQueue,
} from 'src/utils/build-queue.util';
import { serverErrorLabel, translateValue } from 'src/utils/front-labels.util';
import { isNotAllowedError } from 'src/utils/is-not-allowed-error.util';
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

const COLOUR_TAG_COLOR = { GREEN: 'green', YELLOW: 'yellow', RED: 'red' } as const;

const loadWaitingRebuyCount = async () => {
  const result = (await new CoreApiClient().query({
    followups: { __args: { filter: { status: { eq: 'REBUY_PENDING' } } }, totalCount: true },
  } as never)) as unknown as { followups: { totalCount: number } };

  return result.followups.totalCount;
};

const MyFollowups = () => {
  const { t } = useTranslate();
  const [rows, setRows] = useState<MyFollowupRow[] | null>(null);
  const [error, setError] = useState<{ message: string; isNotAllowed: boolean } | null>(null);
  const [tab, setTab] = useState<QueueTab>('TODAY');
  const [waitingRebuyCount, setWaitingRebuyCount] = useState<number | null>(null);

  useEffect(() => {
    new RestApiClient().post<QueueResponse>(`/s${MY_FOLLOWUPS_ROUTE_PATH}`, {}).then(
      (result) =>
        result.success
          ? setRows(result.rows ?? [])
          : setError({
              message: serverErrorLabel(result.error, t('Could not load'), SERVER_ERRORS, t),
              isNotAllowed: isNotAllowedError(result.error),
            }),
      () => setError({ message: t('Could not load your follow-ups'), isNotAllowed: false }),
    );
    loadWaitingRebuyCount().then(setWaitingRebuyCount, () => setWaitingRebuyCount(null));
  }, []);

  const now = new Date();
  const summary = summarizeQueue(rows ?? [], now);
  const visibleRows = buildQueue({ rows: rows ?? [], tab, now });

  return (
    <Page>
      <StatGrid>
        <StatCard>
          <MutedText>{t('Overdue')}</MutedText>
          <StatValue>{summary.red}</StatValue>
        </StatCard>
        <StatCard>
          <MutedText>{t('Due now')}</MutedText>
          <StatValue>{summary.yellow}</StatValue>
        </StatCard>
        <StatCard>
          <MutedText>
            <Trans context="queue-tab">Today</Trans>
          </MutedText>
          <StatValue>{summary.today}</StatValue>
        </StatCard>
        <StatCard>
          <MutedText>
            <Trans context="queue-tab">All</Trans>
          </MutedText>
          <StatValue>{summary.all}</StatValue>
        </StatCard>
        {waitingRebuyCount !== null && (
          <StatCard>
            <MutedText>{t('Rebuy users waiting')}</MutedText>
            <StatValue>{waitingRebuyCount}</StatValue>
          </StatCard>
        )}
      </StatGrid>
      <Tabs.Root value={tab} onValueChange={(value) => setTab(value as QueueTab)}>
        <Tabs.List>
          <Tabs.Tab value="TODAY">
            <Trans context="queue-tab">Today</Trans>
          </Tabs.Tab>
          <Tabs.Tab value="ALL">
            <Trans context="queue-tab">All</Trans>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>
      {error ? (
        <ErrorCallout
          title={error.message}
          hint={error.isNotAllowed ? t('Your role does not allow this page. Ask a Full Admin to check your role.') : undefined}
        />
      ) : rows === null ? (
        <LoadingState />
      ) : visibleRows.length === 0 ? (
        <EmptyState icon={IconCheckbox}>{t('No follow-ups in this list.')}</EmptyState>
      ) : (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <HeaderCell>{t('User')}</HeaderCell>
                <HeaderCell>{t('Next call')}</HeaderCell>
                <HeaderCell>{t('Purpose')}</HeaderCell>
                <HeaderCell>{t('Stage')}</HeaderCell>
                <HeaderCell>{t('Progress')}</HeaderCell>
                <HeaderCell>{t('Last call')}</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.personId}>
                  <Cell>
                    <NameLink href={`/object/person/${row.personId}`}>{row.name || t('User')}</NameLink>
                  </Cell>
                  <Cell>
                    <Tag color={COLOUR_TAG_COLOR[row.colour]}>{formatTehranTime(row.nextCallAt)}</Tag>
                  </Cell>
                  <Cell>
                    {row.purpose.kind === 'CAMPAIGN'
                      ? (row.purpose.campaignName ?? t('Campaign'))
                      : t(PURPOSE_LABEL[row.purpose.kind])}
                  </Cell>
                  <Cell>
                    <Row>
                      {row.platformStage && <Tag color="gray">{row.platformStage}</Tag>}
                      <MutedText>{t('{count} purchases', { count: row.purchaseCount })}</MutedText>
                    </Row>
                  </Cell>
                  <Cell>{formatProgress(row, t)}</Cell>
                  <Cell>
                    {row.lastCall && (
                      <Row>
                        <Tag color={row.lastCall.technicalStatus === 'ANSWERED' ? 'green' : 'gray'}>
                          {translateValue(CALL_STATUS_LABELS, row.lastCall.technicalStatus, t)}
                        </Tag>
                        <NumericValue>{formatTehranTime(row.lastCall.startedAt)}</NumericValue>
                        <MutedText>{row.lastCall.noteLine}</MutedText>
                      </Row>
                    )}
                  </Cell>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      )}
    </Page>
  );
};

export default defineFrontComponent({
  universalIdentifier: MY_FOLLOWUPS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'my-followups',
  description: 'The daily call queue: Today and All tabs, colours and summary counts.',
  component: MyFollowups,
});
