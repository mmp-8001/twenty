import { useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineFrontComponent } from 'twenty-sdk/define';
import { msg, Trans, useRecordId, useTranslate } from 'twenty-sdk/front-component';

import { IconCheckbox } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/primitives/data-display';

import { Item, ItemList, MutedText, NumericValue, Page, Row } from 'src/front-components/components/layout';
import { EmptyState, ErrorCallout, LoadingState } from 'src/front-components/components/state-views';

import { PERSON_SCHEDULE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { translateValue } from 'src/utils/front-labels.util';
import { formatTehranTime } from 'src/utils/format-tehran-time.util';

type TouchRow = { id: string; touchNo: number; windowStartAt: string; windowEndAt: string; status: string };

const TOUCH_STATUS_LABELS = {
  OPEN: msg({ message: 'Open', context: 'touch-status' }),
  DONE: msg({ message: 'Done', context: 'touch-status' }),
  MISSED: msg({ message: 'Missed', context: 'touch-status' }),
  DEFERRED_BY_USER: msg({ message: 'Deferred by user', context: 'touch-status' }),
};

const TOUCH_STATUS_COLORS: Record<string, 'green' | 'red' | 'yellow' | 'blue'> = {
  OPEN: 'blue',
  DONE: 'green',
  MISSED: 'red',
  DEFERRED_BY_USER: 'yellow',
};

const PersonSchedule = () => {
  const personId = useRecordId();
  const { t } = useTranslate();
  const [touches, setTouches] = useState<TouchRow[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!personId) {
      return;
    }

    (async () => {
      const client = new CoreApiClient();
      const { followups } = (await client.query({
        followups: {
          __args: { filter: { personId: { eq: personId }, status: { eq: 'IN_PROGRESS' } }, first: 1 },
          edges: { node: { id: true } },
        },
      } as never)) as unknown as { followups: { edges: { node: { id: string } }[] } };
      const followupId = followups.edges[0]?.node.id;

      if (!followupId) {
        setTouches([]);

        return;
      }

      const result = (await client.query({
        touches: {
          __args: { filter: { followupId: { eq: followupId } }, first: 5, orderBy: [{ touchNo: 'AscNullsFirst' }] },
          edges: { node: { id: true, touchNo: true, windowStartAt: true, windowEndAt: true, status: true } },
        },
      } as never)) as unknown as { touches: { edges: { node: TouchRow }[] } };

      setTouches(result.touches.edges.map(({ node }) => node));
    })().catch(() => setHasError(true));
  }, [personId]);

  if (hasError) {
    return <ErrorCallout title={t('Could not load the schedule')} />;
  }

  if (touches === null) {
    return <LoadingState />;
  }

  if (touches.length === 0) {
    return (
      <EmptyState icon={IconCheckbox}>
        <Trans>The call schedule starts with the first answered call.</Trans>
      </EmptyState>
    );
  }

  return (
    <Page>
      <ItemList>
        {touches.map((touch) => (
          <Item key={touch.id}>
            <Row>
              <strong>{t('Touch {touchNo}', { touchNo: touch.touchNo })}</strong>
              <Tag color={TOUCH_STATUS_COLORS[touch.status] ?? 'gray'}>
                {translateValue(TOUCH_STATUS_LABELS, touch.status, t)}
              </Tag>
            </Row>
            <MutedText>
              <NumericValue>
                {formatTehranTime(touch.windowStartAt)} - {formatTehranTime(touch.windowEndAt)}
              </NumericValue>
            </MutedText>
          </Item>
        ))}
      </ItemList>
    </Page>
  );
};

export default defineFrontComponent({
  universalIdentifier: PERSON_SCHEDULE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'person-schedule',
  description: 'The five call windows of the current case.',
  component: PersonSchedule,
});
