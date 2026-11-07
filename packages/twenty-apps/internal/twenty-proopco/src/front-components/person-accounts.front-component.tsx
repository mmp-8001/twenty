import { useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineFrontComponent } from 'twenty-sdk/define';
import { useRecordId } from 'twenty-sdk/front-component';

import { PERSON_ACCOUNTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

type AccountRow = { id: string; proopcoId: string | null; status: string | null; phase: string | null };

const PersonAccounts = () => {
  const personId = useRecordId();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);

  useEffect(() => {
    if (!personId) {
      return;
    }

    (new CoreApiClient().query({
      challengeAccounts: {
        __args: { filter: { personId: { eq: personId } }, first: 50 },
        edges: { node: { id: true, proopcoId: true, status: true, phase: true } },
      },
    } as never) as Promise<unknown>)
      .then((result) =>
        setAccounts(
          (result as { challengeAccounts: { edges: { node: AccountRow }[] } }).challengeAccounts.edges.map(
            ({ node }) => node,
          ),
        ),
      )
      .catch(() => setAccounts([]));
  }, [personId]);

  if (accounts.length === 0) {
    return <p style={{ padding: 16 }}>No challenge accounts.</p>;
  }

  return (
    <ul style={{ padding: 16 }}>
      {accounts.map((account) => (
        <li key={account.id}>
          {account.proopcoId} · {account.status} · {account.phase}
        </li>
      ))}
    </ul>
  );
};

export default defineFrontComponent({
  universalIdentifier: PERSON_ACCOUNTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'person-accounts',
  description: 'Challenge Accounts of the User.',
  component: PersonAccounts,
});
