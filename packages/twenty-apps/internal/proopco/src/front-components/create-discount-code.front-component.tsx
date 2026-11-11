import { type CSSProperties, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  closeSidePanel,
  enqueueSnackbar,
  msg,
  unmountFrontComponent,
  useTranslate,
} from 'twenty-sdk/front-component';

import { TEHRAN_OFFSET_MS } from 'src/constants/time.constant';
import { CREATE_DISCOUNT_CODE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readServerError } from 'src/front-components/utils/server-error.util';

const ERROR_MESSAGES: Record<string, ReturnType<typeof msg>> = {
  FULL_ADMIN_ONLY: msg('Only a Full Admin can do this.'),
  CODE_REQUIRED: msg('Enter the code text.'),
  CAPABILITY_REQUIRED: msg('Choose what the code does.'),
  EXPIRY_INVALID: msg('Choose an expiry in the future.'),
  CODE_TAKEN: msg('This code already exists.'),
};

const CAPABILITIES = [
  { value: 'DISCOUNT', label: msg('Discount') },
  { value: 'RESET', label: msg('Reset') },
  { value: 'TWO_STEP_PAYMENT', label: msg('Two-step payment') },
];

const styles: Record<string, CSSProperties> = {
  container: {
    fontFamily: 'var(--t-font-family)',
    fontSize: 'var(--t-font-size-sm)',
    color: 'var(--t-font-color-primary)',
    background: 'var(--t-background-primary)',
    padding: 'var(--t-spacing-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--t-spacing-3)',
  },
  input: {
    border: '1px solid var(--t-border-color-medium)',
    borderRadius: 'var(--t-border-radius-sm)',
    padding: 'var(--t-spacing-2)',
    background: 'var(--t-background-secondary)',
    color: 'var(--t-font-color-primary)',
    fontFamily: 'var(--t-font-family)',
    width: '100%',
    boxSizing: 'border-box',
  },
  button: {
    height: 'var(--t-spacing-8)',
    borderRadius: 'var(--t-border-radius-sm)',
    border: '1px solid transparent',
    background: 'var(--t-color-blue)',
    color: 'var(--t-font-color-inverted)',
    cursor: 'pointer',
  },
};

const CreateDiscountCode = () => {
  const { t } = useTranslate();
  // One key per opened form: a second click repeats the same platform create instead of making another.
  const [idempotencyKey] = useState(() => globalThis.crypto.randomUUID());
  const [code, setCode] = useState('');
  const [capability, setCapability] = useState('DISCOUNT');
  const [expiry, setExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const save = async () => {
    setSubmitting(true);

    try {
      await new RestApiClient().post('/s/codes/create', {
        code,
        capability,
        // The input is Tehran wall time.
        expiresAt: new Date(Date.parse(`${expiry}:00Z`) - TEHRAN_OFFSET_MS).toISOString(),
        idempotencyKey,
      });
      await enqueueSnackbar({ message: t(msg('Code created.')), variant: 'success' });
      unmountFrontComponent();
      closeSidePanel();
    } catch (error) {
      const { code: errorCode, message } = readServerError(error);
      const descriptor = errorCode === null ? undefined : ERROR_MESSAGES[errorCode];

      await enqueueSnackbar({
        message: descriptor ? t(descriptor) : (message ?? t(msg('Something went wrong.'))),
        variant: 'error',
      });
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <input style={styles.input} value={code} onChange={(event) => setCode(event.target.value)} placeholder={t(msg('Code'))} />
      <select style={styles.input} value={capability} onChange={(event) => setCapability(event.target.value)}>
        {CAPABILITIES.map(({ value, label }) => (
          <option key={value} value={value}>
            {t(label)}
          </option>
        ))}
      </select>
      <input type="datetime-local" style={styles.input} value={expiry} onChange={(event) => setExpiry(event.target.value)} />
      <button type="button" style={styles.button} disabled={submitting || code.trim() === '' || expiry === ''} onClick={save}>
        {t(msg('Create code'))}
      </button>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: CREATE_DISCOUNT_CODE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'create-discount-code',
  description: 'Side-panel form where a Full Admin creates a code on the platform.',
  component: CreateDiscountCode,
});
