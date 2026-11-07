import { useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineFrontComponent } from 'twenty-sdk/define';
import { msg, Trans, useRecordId, useTranslate } from 'twenty-sdk/front-component';

import { IconCheckbox } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/primitives/data-display';

import { Item, ItemList, MutedText, NumericValue, Page, Row } from 'src/front-components/components/layout';
import { EmptyState, ErrorCallout, LoadingState } from 'src/front-components/components/state-views';

import { PERSON_CALL_HISTORY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { translateValue } from 'src/utils/front-labels.util';
import { formatTehranTime } from 'src/utils/format-tehran-time.util';

type CallRow = { id: string; startedAt: string | null; technicalStatus: string | null; kind: string | null; note: string | null };

const CALL_STATUS_LABELS = {
  ANSWERED: msg({ message: 'Answered', context: 'call-status' }),
  NO_ANSWER: msg({ message: 'No answer', context: 'call-status' }),
  BUSY: msg({ message: 'Busy', context: 'call-status' }),
  SWITCHED_OFF: msg({ message: 'Switched off', context: 'call-status' }),
  REJECTED: msg({ message: 'Rejected', context: 'call-status' }),
  INVALID_NUMBER: msg({ message: 'Invalid number', context: 'call-status' }),
};

const PersonCallHistory = () => {
  const personId = useRecordId();
  const { t } = useTranslate();
  const [calls, setCalls] = useState<CallRow[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!personId) {
      return;
    }

    (new CoreApiClient().query({
      calls: {
        __args: { filter: { personId: { eq: personId } }, first: 100, orderBy: [{ startedAt: 'DescNullsLast' }] },
        edges: { node: { id: true, startedAt: true, technicalStatus: true, kind: true, note: true } },
      },
    } as never) as Promise<unknown>)
      .then((result) =>
        setCalls((result as { calls: { edges: { node: CallRow }[] } }).calls.edges.map(({ node }) => node)),
      )
      .catch(() => setHasError(true));
  }, [personId]);

  if (hasError) {
    return <ErrorCallout title={t('Could not load the calls')} />;
  }

  if (calls === null) {
    return <LoadingState />;
  }

  if (calls.length === 0) {
    return (
      <EmptyState icon={IconCheckbox}>
        <Trans>No calls yet.</Trans>
      </EmptyState>
    );
  }

  return (
    <Page>
      <ItemList>
        {calls.map((call) => (
          <Item key={call.id}>
            <Row>
              <Tag color={call.technicalStatus === 'ANSWERED' ? 'green' : 'gray'}>
                {translateValue(CALL_STATUS_LABELS, call.technicalStatus, t)}
              </Tag>
              {call.kind === 'RETENTION' && (
                <Tag color="blue" variant="outline">
                  {t('retention')}
                </Tag>
              )}
              {call.startedAt && <NumericValue>{formatTehranTime(call.startedAt)}</NumericValue>}
            </Row>
            {call.note && <MutedText>{call.note}</MutedText>}
          </Item>
        ))}
      </ItemList>
    </Page>
  );
};

export default defineFrontComponent({
  universalIdentifier: PERSON_CALL_HISTORY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'person-call-history',
  description: 'Every call logged for the User, including earlier owners.',
  component: PersonCallHistory,
});
