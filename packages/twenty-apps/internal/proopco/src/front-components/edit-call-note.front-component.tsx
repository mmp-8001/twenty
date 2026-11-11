import { useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  closeSidePanel,
  enqueueSnackbar,
  msg,
  unmountFrontComponent,
  useSelectedRecordIds,
  useTranslate,
} from 'twenty-sdk/front-component';

import { EDIT_CALL_NOTE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { formStyles as styles } from 'src/front-components/utils/form-styles.util';
import { readServerError } from 'src/front-components/utils/server-error.util';

const ERROR_MESSAGES: Record<string, ReturnType<typeof msg>> = {
  NOT_AUTHOR: msg('Only the author can edit this note.'),
  NO_ACTIVE_AGENT: msg('This user has no active agent.'),
  AGENT_FROZEN: msg('This agent is frozen.'),
};

const EditCallNote = () => {
  const callId = useSelectedRecordIds()[0];
  const { t } = useTranslate();
  const [note, setNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    unmountFrontComponent();
    closeSidePanel();
  };

  useEffect(() => {
    new CoreApiClient()
      .query({ calls: { __args: { filter: { id: { eq: callId } } }, edges: { node: { note: true } } } })
      .then((result) => {
        const edges = (result as unknown as { calls?: { edges?: { node: { note: string | null } }[] } }).calls?.edges;

        setNote(edges?.[0]?.node.note ?? '');
      });
    // Runs once per opened form.
  }, [callId]);

  const save = async () => {
    setSubmitting(true);

    try {
      await new RestApiClient().post('/s/calls/edit-note', { callId, note });
      await enqueueSnackbar({ message: t(msg('Note saved.')), variant: 'success' });
      close();
    } catch (error) {
      const { code, message } = readServerError(error);
      const descriptor = code === null ? undefined : ERROR_MESSAGES[code];

      await enqueueSnackbar({
        message: descriptor ? t(descriptor) : (message ?? t(msg('Something went wrong.'))),
        variant: 'error',
      });
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.body}>
        <h2 style={styles.title}>{t(msg('Edit note'))}</h2>
        <textarea style={styles.input} value={note ?? ''} disabled={note === null} onChange={(event) => setNote(event.target.value)} />
      </div>
      <div style={styles.footer}>
        <button type="button" style={styles.button} onClick={close} disabled={submitting}>
          {t(msg('Cancel'))}
        </button>
        <button
          type="button"
          style={{ ...styles.button, ...styles.primary, ...(note !== null && !submitting ? {} : styles.disabled) }}
          disabled={note === null || submitting}
          onClick={save}
        >
          {t(msg('Save'))}
        </button>
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: EDIT_CALL_NOTE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'edit-call-note',
  description: 'Side-panel form where the author edits the note of a saved call.',
  component: EditCallNote,
});
