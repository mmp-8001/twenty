import { useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineFrontComponent } from 'twenty-sdk/define';
import { msg, Trans, useRecordId, useTranslate } from 'twenty-sdk/front-component';

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

const PersonSchedule = () => {
  const personId = useRecordId();
  const { t } = useTranslate();
  const [touches, setTouches] = useState<TouchRow[]>([]);

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
        return;
      }

      const result = (await client.query({
        touches: {
          __args: { filter: { followupId: { eq: followupId } }, first: 5, orderBy: [{ touchNo: 'AscNullsFirst' }] },
          edges: { node: { id: true, touchNo: true, windowStartAt: true, windowEndAt: true, status: true } },
        },
      } as never)) as unknown as { touches: { edges: { node: TouchRow }[] } };

      setTouches(result.touches.edges.map(({ node }) => node));
    })().catch(() => setTouches([]));
  }, [personId]);

  if (touches.length === 0) {
    return <p style={{ padding: 16 }}>
        <Trans>The call schedule starts with the first answered call.</Trans>
      </p>;
  }

  return (
    <ol style={{ padding: 16 }}>
      {touches.map((touch) => (
        <li key={touch.id}>
          {t('Touch {touchNo}: {start} to {end} · {status}', {
            touchNo: touch.touchNo,
            start: formatTehranTime(touch.windowStartAt),
            end: formatTehranTime(touch.windowEndAt),
            status: translateValue(TOUCH_STATUS_LABELS, touch.status, t),
          })}
        </li>
      ))}
    </ol>
  );
};

export default defineFrontComponent({
  universalIdentifier: PERSON_SCHEDULE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'person-schedule',
  description: 'The five call windows of the current case.',
  component: PersonSchedule,
});
