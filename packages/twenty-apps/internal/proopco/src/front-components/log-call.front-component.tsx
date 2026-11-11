import { type CSSProperties, useEffect, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  enqueueSnackbar,
  msg,
  useSelectedRecordIds,
  useTranslate,
} from 'twenty-sdk/front-component';

import { TEHRAN_OFFSET_MS } from 'src/constants/time.constant';
import { LOG_CALL_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { closeFormPanel, showServerError } from 'src/front-components/utils/server-error.util';

type ReasonOption = { id: string; kind: string; name: string };
type OfferedCode = { id: string; code: string; capability: string; expiresAt: string; activated: boolean };
type ActivationOutcome = { code: string; status: 'ACTIVE' | 'FAILED'; smsStatus: 'SENT' | 'FAILED' | 'NOT_SENT' };
type Variant = {
  defaultNextCallAt: string | null;
  deadlineAt: string | null;
  planTargetEndsAt: string | null;
};
type Preparation = {
  kind: 'FOLLOW_UP' | 'RETENTION';
  allowsNoNextCall: boolean;
  reasons: ReasonOption[];
  codes: OfferedCode[];
  answered: Variant;
  unanswered: Variant;
};
type NextMode = 'schedule' | 'none' | 'doNotContact';

const NO_ANSWER_STATUSES = [
  { value: 'NO_ANSWER', label: msg('No answer') },
  { value: 'BUSY', label: msg('Busy') },
  { value: 'SWITCHED_OFF', label: msg('Switched off') },
  { value: 'REJECTED', label: msg('Rejected') },
  { value: 'INVALID_NUMBER', label: msg('Invalid number') },
];

const ERROR_MESSAGES: Record<string, ReturnType<typeof msg>> = {
  NOT_OWNER: msg('You can only call contacts you follow up.'),
  REBUY_ADD_FIRST: msg('Add this contact to your follow-ups first.'),
  FOLLOW_UP_ENDED: msg('This follow-up has ended.'),
  STAGE_NOT_CALLABLE: msg('This contact cannot be called now.'),
  NEXT_CALL_AFTER_DEADLINE: msg('The next call cannot be after the deadline.'),
  OUTSIDE_PLAN_REASON_REQUIRED: msg('A time outside the plan needs a reason.'),
  NO_ACTIVE_AGENT: msg('This user has no active agent.'),
  AGENT_FROZEN: msg('This agent is frozen.'),
  CODE_NOT_AVAILABLE: msg('Choose codes that are offered and not yet activated for this contact.'),
  CODES_NOT_ALLOWED: msg('Codes are offered only after an answered call that continues.'),
};

const toTehranInput = (iso: string | null) =>
  iso === null ? '' : new Date(new Date(iso).getTime() + TEHRAN_OFFSET_MS).toISOString().slice(0, 16);
const fromTehranInput = (value: string) => new Date(Date.parse(`${value}:00Z`) - TEHRAN_OFFSET_MS);

const jalaliLine = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(`${locale === 'fa-IR' ? 'fa-IR' : 'en'}-u-ca-persian`, {
    timeZone: 'Asia/Tehran',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(iso));

const styles: Record<string, CSSProperties> = {
  container: {
    fontFamily: 'var(--t-font-family)',
    fontSize: 'var(--t-font-size-sm)',
    color: 'var(--t-font-color-primary)',
    background: 'var(--t-background-primary)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box',
  },
  body: { flex: 1, padding: 'var(--t-spacing-4)', display: 'flex', flexDirection: 'column', gap: 'var(--t-spacing-3)' },
  title: { margin: 0, fontSize: 'var(--t-font-size-md)', fontWeight: 'var(--t-font-weight-semi-bold)' },
  row: { display: 'flex', alignItems: 'center', gap: 'var(--t-spacing-2)' },
  hint: { color: 'var(--t-font-color-tertiary)', fontSize: 'var(--t-font-size-xs)' },
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
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--t-spacing-2)',
    padding: 'var(--t-spacing-3)',
    borderTop: '1px solid var(--t-border-color-light)',
  },
  button: {
    height: 'var(--t-spacing-8)',
    padding: '0 var(--t-spacing-3)',
    borderRadius: 'var(--t-border-radius-sm)',
    border: '1px solid var(--t-border-color-medium)',
    background: 'var(--t-background-secondary)',
    color: 'var(--t-font-color-secondary)',
    cursor: 'pointer',
  },
  primary: { background: 'var(--t-color-blue)', color: 'var(--t-font-color-inverted)', border: '1px solid transparent' },
  disabled: { opacity: 0.5, cursor: 'not-allowed' },
};

const LogCallForm = () => {
  const recordIds = useSelectedRecordIds();
  const personId = recordIds.length === 1 ? recordIds[0] : null;
  const { t, locale } = useTranslate();
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [idempotencyKey] = useState(() => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [step, setStep] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [technicalStatus, setTechnicalStatus] = useState('NO_ANSWER');
  const [reasonIds, setReasonIds] = useState<string[]>([]);
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [mode, setMode] = useState<NextMode>('schedule');
  const [nextInput, setNextInput] = useState('');
  const [outsidePlanReason, setOutsidePlanReason] = useState('USER_REQUEST');
  const [doNotContactReasonId, setDoNotContactReasonId] = useState('');
  const [note, setNote] = useState('');
  const [codeIds, setCodeIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const showError = (error: unknown) => {
    return showServerError(error, ERROR_MESSAGES, t, msg('Something went wrong.'));
  };

  useEffect(() => {
    if (personId === null) {
      return;
    }

    new RestApiClient()
      .post<Preparation>('/s/calls/prepare', { personId })
      .then(setPreparation)
      .catch(async (error) => {
        await showError(error);
        closeFormPanel();
      });
  }, [personId]);

  if (preparation === null) {
    return <div style={styles.container} />;
  }

  const variant = answered ? preparation.answered : preparation.unanswered;
  const showCodes = answered === true && mode !== 'doNotContact' && preparation.codes.length > 0;
  const stepOrder = answered ? [0, 1, 2, ...(showCodes ? [3] : [])] : [0, 2];
  const lastStep = stepOrder[stepOrder.length - 1];
  const reasonsOfKind = (kind: string) => preparation.reasons.filter((reason) => reason.kind === kind);
  const reasonsValid = !answered || reasonIds.length > 0 || (otherChecked && otherText.trim() !== '');
  const nextAt = nextInput === '' ? null : fromTehranInput(nextInput);
  const needsOutsidePlan =
    mode === 'schedule' && nextAt !== null && variant.planTargetEndsAt !== null && nextAt >= new Date(variant.planTargetEndsAt);
  const nextValid =
    mode === 'doNotContact'
      ? doNotContactReasonId !== ''
      : mode === 'none'
        ? true
        : nextAt !== null &&
          nextAt > new Date() &&
          (variant.deadlineAt === null || nextAt <= new Date(variant.deadlineAt));
  const stepValid =
    step === 0 ? answered !== null : step === 1 ? reasonsValid : step === 3 ? true : nextValid && (!answered || reasonsValid);

  const chooseAnswered = (value: boolean) => {
    const nextVariant = value ? preparation.answered : preparation.unanswered;

    setAnswered(value);
    setTechnicalStatus(value ? 'ANSWERED' : 'NO_ANSWER');
    setMode(nextVariant.defaultNextCallAt === null && preparation.allowsNoNextCall ? 'none' : 'schedule');
    setNextInput(toTehranInput(nextVariant.defaultNextCallAt));
  };

  const save = async () => {
    setSubmitting(true);

    try {
      const result = await new RestApiClient().post<{ activations: ActivationOutcome[] }>('/s/calls/log', {
        personId,
        idempotencyKey,
        technicalStatus,
        reasonIds: answered ? reasonIds : [],
        otherReasonText: answered && otherChecked ? otherText : null,
        note,
        codeIds: showCodes ? codeIds : [],
        next:
          mode === 'doNotContact'
            ? { mode, reasonId: doNotContactReasonId }
            : mode === 'none'
              ? { mode }
              : {
                  mode,
                  at: nextAt?.toISOString(),
                  outsidePlanReason: needsOutsidePlan ? outsidePlanReason : null,
                },
      });
      await enqueueSnackbar({ message: t(msg('Call saved.')), variant: 'success' });

      for (const { code, status, smsStatus } of result.activations ?? []) {
        if (status === 'FAILED') {
          await enqueueSnackbar({ message: t(msg('Code {code} could not be activated. Retry it from its activation.'), { code }), variant: 'error' });
        } else if (smsStatus === 'FAILED') {
          await enqueueSnackbar({ message: t(msg('Code {code} is active but the SMS failed. Resend it from its activation.'), { code }), variant: 'error' });
        }
      }

      closeFormPanel();
    } catch (error) {
      await showError(error);
      setSubmitting(false);
    }
  };

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((item) => item !== id) : [...list, id];

  const reasonChecks = (kind: string, label: ReturnType<typeof msg>) => {
    const reasons = reasonsOfKind(kind);

    return reasons.length === 0 ? null : (
      <div>
        <div style={styles.hint}>{t(label)}</div>
        {reasons.map((reason) => (
          <label key={reason.id} style={styles.row}>
            <input
              type="checkbox"
              checked={reasonIds.includes(reason.id)}
              onChange={() => setReasonIds(toggle(reasonIds, reason.id))}
            />
            {reason.name}
          </label>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.body}>
        <h2 style={styles.title}>{t(msg('Log call'))}</h2>

        {step === 0 && (
          <>
            <div style={styles.hint}>{t(msg('What happened?'))}</div>
            <label style={styles.row}>
              <input type="radio" name="answered" checked={answered === true} onChange={() => chooseAnswered(true)} />
              {t(msg('They answered'))}
            </label>
            <label style={styles.row}>
              <input type="radio" name="answered" checked={answered === false} onChange={() => chooseAnswered(false)} />
              {t(msg('No answer'))}
            </label>
            {answered === false && (
              <select style={styles.input} value={technicalStatus} onChange={(event) => setTechnicalStatus(event.target.value)}>
                {NO_ANSWER_STATUSES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {t(label)}
                  </option>
                ))}
              </select>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <div style={styles.hint}>{t(msg('Why?'))}</div>
            {reasonChecks('SATISFACTION', msg('Satisfaction'))}
            {reasonChecks('DISSATISFACTION', msg('Dissatisfaction'))}
            <label style={styles.row}>
              <input type="checkbox" checked={otherChecked} onChange={() => setOtherChecked(!otherChecked)} />
              {t(msg('Other'))}
            </label>
            {otherChecked && (
              <textarea
                style={styles.input}
                value={otherText}
                onChange={(event) => setOtherText(event.target.value)}
                placeholder={t(msg('Describe the reason (required)'))}
              />
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div style={styles.hint}>{t(msg('What next?'))}</div>
            <label style={styles.row}>
              <input type="radio" name="next" checked={mode === 'schedule'} onChange={() => setMode('schedule')} />
              {t(msg('Schedule the next call'))}
            </label>
            {preparation.allowsNoNextCall && answered && (
              <label style={styles.row}>
                <input type="radio" name="next" checked={mode === 'none'} onChange={() => setMode('none')} />
                {t(msg('No next call'))}
              </label>
            )}
            <label style={styles.row}>
              <input type="radio" name="next" checked={mode === 'doNotContact'} onChange={() => setMode('doNotContact')} />
              {t(msg('Do not contact'))}
            </label>
            {mode === 'schedule' && (
              <>
                <input
                  type="datetime-local"
                  style={styles.input}
                  value={nextInput}
                  max={toTehranInput(variant.deadlineAt) || undefined}
                  onChange={(event) => setNextInput(event.target.value)}
                />
                {nextAt !== null && <div style={styles.hint}>{jalaliLine(nextAt.toISOString(), locale)}</div>}
                {needsOutsidePlan && (
                  <select style={styles.input} value={outsidePlanReason} onChange={(event) => setOutsidePlanReason(event.target.value)}>
                    <option value="USER_REQUEST">{t(msg('User request'))}</option>
                    <option value="ADMIN_DECISION">{t(msg('Admin decision'))}</option>
                  </select>
                )}
              </>
            )}
            {mode === 'doNotContact' && (
              <select style={styles.input} value={doNotContactReasonId} onChange={(event) => setDoNotContactReasonId(event.target.value)}>
                <option value="">{t(msg('Choose a reason'))}</option>
                {reasonsOfKind('DO_NOT_CONTACT').map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.name}
                  </option>
                ))}
              </select>
            )}
            <textarea
              style={styles.input}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t(msg('Note (optional)'))}
            />
          </>
        )}

        {step === 3 && (
          <>
            <div style={styles.hint}>{t(msg('Offer a code?'))}</div>
            {preparation.codes.map((offered) => (
              <label key={offered.id} style={styles.row}>
                <input
                  type="checkbox"
                  disabled={offered.activated}
                  checked={codeIds.includes(offered.id)}
                  onChange={() => setCodeIds(toggle(codeIds, offered.id))}
                />
                {offered.code}
                {offered.activated && (
                  <span style={styles.hint}>
                    {t(msg('Activated for this user, until {expiry}'), { expiry: jalaliLine(offered.expiresAt, locale) })}
                  </span>
                )}
              </label>
            ))}
          </>
        )}
      </div>

      <div style={styles.footer}>
        <button type="button" style={styles.button} onClick={step === 0 ? closeFormPanel : () => setStep(stepOrder[stepOrder.indexOf(step) - 1])} disabled={submitting}>
          {step === 0 ? t(msg('Cancel')) : t(msg('Back'))}
        </button>
        <button
          type="button"
          style={{ ...styles.button, ...styles.primary, ...(stepValid && !submitting ? {} : styles.disabled) }}
          disabled={!stepValid || submitting}
          onClick={step === lastStep ? save : () => setStep(stepOrder[stepOrder.indexOf(step) + 1])}
        >
          {step === lastStep ? t(msg('Save')) : t(msg('Next'))}
        </button>
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier: LOG_CALL_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'log-call',
  description: 'Side-panel form that saves a call with its reasons, next call and note.',
  component: LogCallForm,
});
