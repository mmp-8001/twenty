import { useEffect, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { Trans, useRecordId } from 'twenty-sdk/front-component';

import { PERSON_DETAILS_ROUTE_PATH } from 'src/constants/ownership.constant';
import { PERSON_ACCOUNTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { postRoute } from 'src/utils/post-route.util';

type AccountRow = { id: string; proopcoId: string | null; status: string | null; phase: string | null };

const PersonAccounts = () => {
  const personId = useRecordId();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);

  useEffect(() => {
    if (!personId) {
      return;
    }

    postRoute<{ success: boolean; accounts?: AccountRow[] }>(PERSON_DETAILS_ROUTE_PATH, { personId })
      .then((result) => setAccounts(result.accounts ?? []))
      .catch(() => setAccounts([]));
  }, [personId]);

  if (accounts.length === 0) {
    return <p style={{ padding: 16 }}>
        <Trans>No challenge accounts.</Trans>
      </p>;
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
