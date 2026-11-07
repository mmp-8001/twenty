import { useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineFrontComponent } from 'twenty-sdk/define';
import { useRecordId } from 'twenty-sdk/front-component';

import { PERSON_CALL_HISTORY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { formatTehranTime } from 'src/utils/format-tehran-time.util';

type CallRow = { id: string; startedAt: string | null; technicalStatus: string | null; kind: string | null; note: string | null };

const PersonCallHistory = () => {
  const personId = useRecordId();
  const [calls, setCalls] = useState<CallRow[]>([]);

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
      .catch(() => setCalls([]));
  }, [personId]);

  if (calls.length === 0) {
    return <p style={{ padding: 16 }}>No calls yet.</p>;
  }

  return (
    <ul style={{ padding: 16 }}>
      {calls.map((call) => (
        <li key={call.id}>
          {call.startedAt ? formatTehranTime(call.startedAt) : ''} · {call.technicalStatus?.replace(/_/g, ' ').toLowerCase()}
          {call.kind === 'RETENTION' ? ' · retention' : ''} · {call.note}
        </li>
      ))}
    </ul>
  );
};

export default defineFrontComponent({
  universalIdentifier: PERSON_CALL_HISTORY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'person-call-history',
  description: 'Every call logged for the User, including earlier owners.',
  component: PersonCallHistory,
});
