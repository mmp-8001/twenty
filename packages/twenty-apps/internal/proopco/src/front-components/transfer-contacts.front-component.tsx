import { useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  enqueueSnackbar,
  msg,
  useSelectedRecordIds,
  useTranslate,
} from 'twenty-sdk/front-component';

import { TRANSFER_CONTACTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { formStyles as styles } from 'src/front-components/utils/form-styles.util';
import { closeFormPanel, showServerError } from 'src/front-components/utils/server-error.util';

type Result = { succeeded: string[]; failed: { personId: string; message: string }[] };
type AgentOption = { id: string; name: string };

const ERROR_MESSAGES: Record<string, ReturnType<typeof msg>> = {
  STAFF_ONLY: msg('Only a Supervisor or Full Admin can do this.'),
  REASON_REQUIRED: msg('A reason is required.'),
  INVALID_SELECTION: msg('Choose between 1 and 50 contacts.'),
  TARGET_INACTIVE: msg('Choose an active agent.'),
  TARGET_FROZEN: msg('A frozen agent cannot receive contacts.'),
  TARGET_ROLE: msg('The target must have the Agent or Supervisor role.'),
};

// Transfer and Release differ only by the target picker and the endpoint.
const TransferContacts = () => {
  const personIds = useSelectedRecordIds();
  const { t } = useTranslate();
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [mode, setMode] = useState<'TRANSFER' | 'RELEASE'>('TRANSFER');
  const [toAgentId, setToAgentId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [failures, setFailures] = useState<Result['failed']>([]);
  const isTransfer = mode === 'TRANSFER';

  useEffect(() => {
    new CoreApiClient()
      .query({
        agents: {
          __args: { filter: { and: [{ isActive: { eq: true } }, { frozenSince: { is: 'NULL' } }] } },
          edges: { node: { id: true, name: true } },
        },
      })
      .then((result) => {
        const connection = (result as unknown as { agents?: { edges?: { node: AgentOption }[] } }).agents;

        setAgents((connection?.edges ?? []).map(({ node }) => node));
      });
  }, []);

  const valid = reason.trim() !== '' && personIds.length > 0 && (!isTransfer || toAgentId !== '');

  const submit = async () => {
    setSubmitting(true);

    try {
      const result = await new RestApiClient().post<Result>(
        isTransfer ? '/s/contacts/transfer' : '/s/contacts/release',
        { personIds, reason, ...(isTransfer ? { toAgentId } : {}) },
      );

      await enqueueSnackbar({
        message: t(isTransfer ? msg('{count} contacts transferred.') : msg('{count} contacts released.'), {
          count: String(result.succeeded.length),
        }),
        variant: result.failed.length === 0 ? 'success' : 'error',
      });

      if (result.failed.length === 0) {
        closeFormPanel();
      } else {
        setFailures(result.failed);
        setSubmitting(false);
      }
    } catch (error) {
      await showServerError(error, ERROR_MESSAGES, t, msg('Something went wrong.'));
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.body}>
        <h2 style={styles.title}>{t(msg('Transfer or release contacts'))}</h2>
        <label>
          <input type="radio" name="mode" checked={isTransfer} onChange={() => setMode('TRANSFER')} />
          {t(msg('Transfer to an agent'))}
        </label>
        <label>
          <input type="radio" name="mode" checked={!isTransfer} onChange={() => setMode('RELEASE')} />
          {t(msg('Release to the free pool'))}
        </label>
        <div style={styles.hint}>{t(msg('{count} contacts selected'), { count: String(personIds.length) })}</div>
        {isTransfer && (
          <select style={styles.input} value={toAgentId} onChange={(event) => setToAgentId(event.target.value)}>
            <option value="">{t(msg('Choose an agent'))}</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        )}
        <textarea
          style={styles.input}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t(msg('Reason (required)'))}
        />
        {failures.map((failure) => (
          <div key={failure.personId} style={styles.hint}>
            {failure.message}
          </div>
        ))}
      </div>
      <div style={styles.footer}>
        <button type="button" style={styles.button} onClick={closeFormPanel} disabled={submitting}>
          {t(msg('Cancel'))}
        </button>
        <button
          type="button"
          style={{ ...styles.button, ...styles.primary, ...(valid && !submitting ? {} : styles.disabled) }}
          disabled={!valid || submitting}
          onClick={submit}
        >
          {isTransfer ? t(msg('Transfer')) : t(msg('Release'))}
        </button>
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: TRANSFER_CONTACTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'transfer-contacts',
  description: 'Side-panel form that transfers or releases the selected contacts with a reason.',
  component: TransferContacts,
});
