import { useEffect, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { Trans, useRecordId, useTranslate } from 'twenty-sdk/front-component';

import { IconUsers } from 'twenty-ui/icon';
import { Tag } from 'twenty-ui/primitives/data-display';

import { Item, ItemList, MutedText, Page, Row } from 'src/front-components/components/layout';
import { EmptyState, ErrorCallout, LoadingState } from 'src/front-components/components/state-views';

import { PERSON_DETAILS_ROUTE_PATH } from 'src/constants/ownership.constant';
import { PERSON_ACCOUNTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { postRoute } from 'src/utils/post-route.util';

type AccountRow = { id: string; proopcoId: string | null; status: string | null; phase: string | null };

const PersonAccounts = () => {
  const personId = useRecordId();
  const { t } = useTranslate();
  const [accounts, setAccounts] = useState<AccountRow[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!personId) {
      return;
    }

    postRoute<{ success: boolean; accounts?: AccountRow[] }>(PERSON_DETAILS_ROUTE_PATH, { personId })
      .then((result) => setAccounts(result.accounts ?? []))
      .catch(() => setHasError(true));
  }, [personId]);

  if (hasError) {
    return <ErrorCallout title={t('Could not load the accounts')} />;
  }

  if (accounts === null) {
    return <LoadingState />;
  }

  if (accounts.length === 0) {
    return (
      <EmptyState icon={IconUsers}>
        <Trans>No challenge accounts.</Trans>
      </EmptyState>
    );
  }

  return (
    <Page>
      <ItemList>
        {accounts.map((account) => (
          <Item key={account.id}>
            <Row>
              <strong>{account.proopcoId}</strong>
              {account.status && <Tag color="gray">{account.status}</Tag>}
            </Row>
            {account.phase && <MutedText>{account.phase}</MutedText>}
          </Item>
        ))}
      </ItemList>
    </Page>
  );
};

export default defineFrontComponent({
  universalIdentifier: PERSON_ACCOUNTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'person-accounts',
  description: 'Challenge Accounts of the User.',
  component: PersonAccounts,
});
