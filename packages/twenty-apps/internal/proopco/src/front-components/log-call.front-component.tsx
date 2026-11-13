import 'twenty-ui/style.css';
import 'twenty-ui/theme-dark.css';
import 'twenty-ui/theme-light.css';

import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  enqueueSnackbar,
  msg,
  useColorScheme,
  useSelectedRecordIds,
  useTranslate,
} from 'twenty-sdk/front-component';
import { Callout } from 'twenty-ui/components/feedback';
import { Tag } from 'twenty-ui/primitives/data-display';
import { Skeleton } from 'twenty-ui/primitives/feedback';
import { Button, Checkbox, Input, Radio, RadioGroup, Select, Textarea } from 'twenty-ui/primitives/input';
import { THEME_DARK, THEME_LIGHT, ThemeProvider } from 'twenty-ui/theme';

import { DAY_MS, TEHRAN_OFFSET_MS } from 'src/constants/time.constant';
import { type RefusalCode } from 'src/constants/refusal-codes.constant';
import { LOG_CALL_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { newIdempotencyKey } from 'src/front-components/utils/new-idempotency-key.util';
import { closeFormPanel, showServerError } from 'src/front-components/utils/server-error.util';

type ReasonOption = { id: string; kind: string; name: string };
type OfferedCode = { id: string; code: string; capability: string; expiresAt: string; activated: boolean };
type ActivationOutcome = { code: string; status: 'ACTIVE' | 'FAILED'; smsStatus: 'SENT' | 'FAILED' | 'NOT_SENT' };
type Variant = {
  defaultNextCallAt: string | null;
  deadlineAt: string | null;
  planTargetEndsAt: string | null;
  planTargetStartsAt: string | null;
  planTargetSlot: number | null;
};
type Preparation = {
  kind: 'FOLLOW_UP' | 'RETENTION';
  contactName: string;
  campaignName: string | null;
  progress: string | null;
  allowsNoNextCall: boolean;
  reasons: ReasonOption[];
  codes: OfferedCode[];
  answered: Variant;
  unanswered: Variant;
};

const TECHNICAL_STATUSES = [
  { value: 'ANSWERED', label: msg('They answered') },
  { value: 'NO_ANSWER', label: msg('No answer') },
  { value: 'BUSY', label: msg('Busy') },
  { value: 'SWITCHED_OFF', label: msg('Switched off') },
  { value: 'REJECTED', label: msg('Rejected') },
  { value: 'INVALID_NUMBER', label: msg('Invalid number') },
];

const CAPABILITY_LABELS: Record<string, ReturnType<typeof msg>> = {
  DISCOUNT: msg('Discount'),
  RESET: msg('Reset'),
  TWO_STEP_PAYMENT: msg('Two-step payment'),
};

const ERROR_MESSAGES: Partial<Record<RefusalCode, ReturnType<typeof msg>>> = {
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

// Retention calls have no deadline; the date list still needs an end.
const OPEN_ENDED_SCHEDULE_DAYS = 60;
const DEFAULT_CALL_TIME = '10:00';

const tehranDay = (date: Date) => new Date(date.getTime() + TEHRAN_OFFSET_MS).toISOString().slice(0, 10);
const tehranTime = (date: Date) => new Date(date.getTime() + TEHRAN_OFFSET_MS).toISOString().slice(11, 16);
const fromTehran = (day: string, time: string) => new Date(Date.parse(`${day}T${time}:00Z`) - TEHRAN_OFFSET_MS);
const addDays = (day: string, count: number) => new Date(Date.parse(`${day}T12:00:00Z`) + count * DAY_MS).toISOString().slice(0, 10);

const intlLocale = (locale: string) => `${locale === 'fa-IR' ? 'fa-IR' : 'en'}-u-ca-persian`;
const formatDay = (day: string, locale: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(intlLocale(locale), { timeZone: 'UTC', ...options }).format(new Date(`${day}T12:00:00Z`));
const formatTime = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(intlLocale(locale), { timeZone: 'Asia/Tehran', timeStyle: 'short' }).format(date);
const formatNumber = (value: number, locale: string) => new Intl.NumberFormat(intlLocale(locale)).format(value);

const dayRange = (first: string, last: string) => {
  const days: string[] = [];

  for (let day = first; day <= last; day = addDays(day, 1)) {
    days.push(day);
  }

  return days;
};

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
  body: { flex: 1, overflowY: 'auto', padding: 'var(--t-spacing-4)', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', flexDirection: 'column', gap: 'var(--t-spacing-1)', paddingBottom: 'var(--t-spacing-4)' },
  title: { margin: 0, fontSize: 'var(--t-font-size-lg)', fontWeight: 'var(--t-font-weight-semi-bold)' },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--t-spacing-2)',
    padding: 'var(--t-spacing-4) 0',
    borderTop: '1px solid var(--t-border-color-light)',
  },
  label: { fontWeight: 'var(--t-font-weight-semi-bold)' },
  required: { color: 'var(--t-color-red)' },
  optional: { color: 'var(--t-font-color-tertiary)', fontWeight: 'var(--t-font-weight-regular)' },
  hint: { color: 'var(--t-font-color-tertiary)', fontSize: 'var(--t-font-size-xs)' },
  group: { color: 'var(--t-font-color-secondary)', fontSize: 'var(--t-font-size-xs)', marginTop: 'var(--t-spacing-1)' },
  wrap: { display: 'flex', flexWrap: 'wrap', gap: 'var(--t-spacing-2)' },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--t-spacing-2)',
    padding: 'var(--t-spacing-2) var(--t-spacing-3)',
    border: '1px solid var(--t-border-color-medium)',
    borderRadius: 'var(--t-border-radius-pill)',
    cursor: 'pointer',
  },
  pillChecked: { borderColor: 'var(--t-color-blue)', background: 'var(--t-accent-quaternary)' },
  codeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--t-spacing-2)',
    padding: 'var(--t-spacing-2) var(--t-spacing-3)',
    border: '1px solid var(--t-border-color-medium)',
    borderRadius: 'var(--t-border-radius-md)',
  },
  grow: { flex: 1 },
  fieldRow: { display: 'flex', gap: 'var(--t-spacing-2)', alignItems: 'flex-end', flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column', gap: 'var(--t-spacing-1)', minWidth: 120 },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 'var(--t-spacing-2)',
    padding: 'var(--t-spacing-3)',
    borderTop: '1px solid var(--t-border-color-light)',
  },
};

const SectionLabel = ({ children, required, note }: { children: ReactNode; required?: boolean; note?: string }) => (
  <div style={styles.label}>
    {children}
    {required && <span style={styles.required}> *</span>}
    {note !== undefined && <span style={styles.optional}> {note}</span>}
  </div>
);

const CheckPill = ({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: ReactNode }) => (
  <label style={{ ...styles.pill, ...(checked ? styles.pillChecked : {}) }}>
    <Checkbox checked={checked} onCheckedChange={onToggle} />
    {children}
  </label>
);

const LogCallForm = () => {
  const recordIds = useSelectedRecordIds();
  const personId = recordIds.length === 1 ? recordIds[0] : null;
  const { t, locale } = useTranslate();
  const colorScheme = useColorScheme();
  const [openedAt] = useState(() => new Date());
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [technicalStatus, setTechnicalStatus] = useState<string | null>(null);
  const [reasonIds, setReasonIds] = useState<string[]>([]);
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [noNextCall, setNoNextCall] = useState(false);
  const [nextDay, setNextDay] = useState('');
  const [nextTime, setNextTime] = useState(DEFAULT_CALL_TIME);
  const [outsidePlanReason, setOutsidePlanReason] = useState<string | null>(null);
  const [doNotContactReasonId, setDoNotContactReasonId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [codeIds, setCodeIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const showError = (error: unknown) => showServerError(error, ERROR_MESSAGES, t, msg('Something went wrong.'));

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

  const withTheme = (content: ReactNode) => (
    <ThemeProvider colorScheme={colorScheme} theme={colorScheme === 'dark' ? THEME_DARK : THEME_LIGHT}>
      <div style={styles.container}>{content}</div>
    </ThemeProvider>
  );

  if (preparation === null) {
    return withTheme(
      <div style={styles.body}>
        <Skeleton height={24} />
      </div>,
    );
  }

  const answered = technicalStatus === 'ANSWERED';
  const variant = answered ? preparation.answered : preparation.unanswered;
  const doNotContact = doNotContactReasonId !== null;
  const schedules = !doNotContact && !(noNextCall && answered && preparation.allowsNoNextCall);
  const showCodes = answered && !doNotContact && preparation.codes.length > 0;
  const reasonsOfKind = (kind: string) => preparation.reasons.filter((reason) => reason.kind === kind);

  const today = tehranDay(openedAt);
  const lastDay = variant.deadlineAt === null ? addDays(today, OPEN_ENDED_SCHEDULE_DAYS) : tehranDay(new Date(variant.deadlineAt));
  const suggestedFirst = variant.planTargetStartsAt === null ? null : tehranDay(new Date(variant.planTargetStartsAt));
  const suggestedLast =
    variant.planTargetEndsAt === null ? null : tehranDay(new Date(new Date(variant.planTargetEndsAt).getTime() - 1));
  const isSuggested = (day: string) => suggestedFirst !== null && suggestedLast !== null && day >= suggestedFirst && day <= suggestedLast;

  const nextAt = nextDay === '' ? null : fromTehran(nextDay, nextTime);
  const needsOutsidePlan =
    schedules && nextAt !== null && variant.planTargetEndsAt !== null && nextAt >= new Date(variant.planTargetEndsAt);
  const reasonsValid = !answered || reasonIds.length > 0 || (otherChecked && otherText.trim() !== '');
  const nextValid =
    !schedules ||
    (nextAt !== null &&
      nextAt > new Date() &&
      (variant.deadlineAt === null || nextAt <= new Date(variant.deadlineAt)) &&
      (!needsOutsidePlan || outsidePlanReason !== null));
  const canSave = technicalStatus !== null && reasonsValid && nextValid && !submitting;

  const chooseStatus = (value: string) => {
    const nextVariant = value === 'ANSWERED' ? preparation.answered : preparation.unanswered;
    const defaultAt = nextVariant.defaultNextCallAt === null ? null : new Date(nextVariant.defaultNextCallAt);

    setTechnicalStatus(value);
    setNoNextCall(defaultAt === null && preparation.allowsNoNextCall);
    setNextDay(defaultAt === null ? '' : tehranDay(defaultAt));
    setNextTime(defaultAt === null ? DEFAULT_CALL_TIME : tehranTime(defaultAt));
    setOutsidePlanReason(null);
  };

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

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
        next: doNotContact
          ? { mode: 'doNotContact', reasonId: doNotContactReasonId }
          : !schedules
            ? { mode: 'none' }
            : {
                mode: 'schedule',
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

  const reasonGroup = (kind: string, label: ReturnType<typeof msg>) => {
    const reasons = reasonsOfKind(kind);

    return reasons.length === 0 ? null : (
      <>
        <div style={styles.group}>{t(label)}</div>
        <div style={styles.wrap}>
          {reasons.map((reason) => (
            <CheckPill key={reason.id} checked={reasonIds.includes(reason.id)} onToggle={() => setReasonIds(toggle(reasonIds, reason.id))}>
              {reason.name}
            </CheckPill>
          ))}
        </div>
      </>
    );
  };

  const subtitle = [preparation.campaignName, preparation.progress, t(msg('Call started {time}'), { time: formatTime(openedAt, locale) })]
    .filter((part) => part !== null && part !== '')
    .join(' · ');
  const deadlineDay = variant.deadlineAt === null ? null : tehranDay(new Date(variant.deadlineAt));

  return withTheme(
    <>
      <div style={styles.body}>
        <div style={styles.header}>
          <h2 style={styles.title}>{t(msg('End of call · {name}'), { name: preparation.contactName })}</h2>
          <div style={styles.hint}>{subtitle}</div>
        </div>

        <div style={styles.section}>
          <SectionLabel required>{t(msg('Call outcome'))}</SectionLabel>
          <RadioGroup
            orientation="horizontal"
            aria-label={t(msg('Call outcome'))}
            value={technicalStatus}
            onValueChange={(value) => chooseStatus(value as string)}
            style={styles.wrap}
          >
            {TECHNICAL_STATUSES.map(({ value, label }) => (
              <Radio key={value} value={value} style={{ ...styles.pill, ...(technicalStatus === value ? styles.pillChecked : {}) }}>
                {t(label)}
              </Radio>
            ))}
          </RadioGroup>
          <div style={styles.hint}>
            {t(msg('The outcome cannot be changed after saving. Any outcome other than Answered hides the reasons and codes.'))}
          </div>
        </div>

        <div style={styles.section}>
          <SectionLabel note={t(msg('(optional, editable later)'))}>{t(msg('Result and note'))}</SectionLabel>
          <Textarea value={note} onValueChange={setNote} rows={3} autoResize maxRows={8} aria-label={t(msg('Result and note'))} />
        </div>

        {answered && (
          <div style={styles.section}>
            <SectionLabel required note={t(msg('choose any'))}>{t(msg('Satisfaction and dissatisfaction reasons'))}</SectionLabel>
            {reasonGroup('DISSATISFACTION', msg('Dissatisfaction'))}
            {reasonGroup('SATISFACTION', msg('Satisfaction'))}
            <div style={styles.wrap}>
              <CheckPill checked={otherChecked} onToggle={() => setOtherChecked(!otherChecked)}>
                {t(msg('Other'))}
              </CheckPill>
            </div>
            {otherChecked && (
              <Input
                value={otherText}
                onValueChange={setOtherText}
                placeholder={t(msg('Describe the reason (required)'))}
                aria-label={t(msg('Other reason'))}
              />
            )}
          </div>
        )}

        {technicalStatus !== null && !doNotContact && (
          <div style={styles.section}>
            <SectionLabel required={!preparation.allowsNoNextCall || !answered}>{t(msg('Next call time'))}</SectionLabel>
            {preparation.allowsNoNextCall && answered && (
              <div style={styles.wrap}>
                <CheckPill checked={noNextCall} onToggle={() => setNoNextCall(!noNextCall)}>
                  {t(msg('No next call'))}
                </CheckPill>
              </div>
            )}
            {schedules && (
              <>
                <div style={styles.fieldRow}>
                  <div style={{ ...styles.field, ...styles.grow }}>
                    <span style={styles.hint}>{t(msg('Date'))}</span>
                    <Select.Root value={nextDay === '' ? null : nextDay} onValueChange={(value) => setNextDay((value as string | null) ?? '')}>
                      <Select.Trigger aria-label={t(msg('Date'))}>
                        <Select.Value placeholder={t(msg('Choose a date'))}>
                          {(value: string | null) => (value === null ? t(msg('Choose a date')) : formatDay(value, locale, { weekday: 'long', day: 'numeric', month: 'long' }))}
                        </Select.Value>
                        <Select.Icon />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Positioner sideOffset={4} align="start">
                          <Select.Popup>
                            {dayRange(today, lastDay).map((day) => (
                              <Select.Item key={day} value={day}>
                                <Select.ItemText>
                                  {formatDay(day, locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                                  {isSuggested(day) ? ` · ${t(msg('suggested'))}` : ''}
                                </Select.ItemText>
                                <Select.ItemIndicator />
                              </Select.Item>
                            ))}
                          </Select.Popup>
                        </Select.Positioner>
                      </Select.Portal>
                    </Select.Root>
                  </div>
                  <div style={styles.field}>
                    <span style={styles.hint}>{t(msg('Time'))}</span>
                    <Input type="time" value={nextTime} onValueChange={setNextTime} aria-label={t(msg('Time'))} />
                  </div>
                </div>
                {suggestedFirst !== null && suggestedLast !== null && variant.planTargetSlot !== null && (
                  <div>
                    <Tag color="blue" variant="soft">
                      {t(msg('Suggested: attempt {slot}, {from} to {to}'), {
                        slot: formatNumber(variant.planTargetSlot, locale),
                        from: formatDay(suggestedFirst, locale, { day: 'numeric', month: 'long' }),
                        to: formatDay(suggestedLast, locale, { day: 'numeric', month: 'long' }),
                      })}
                    </Tag>
                  </div>
                )}
                {deadlineDay !== null && (
                  <div style={styles.hint}>
                    {t(msg('No later than the end of the follow-up ({deadline}).'), {
                      deadline: formatDay(deadlineDay, locale, { day: 'numeric', month: 'long' }),
                    })}
                  </div>
                )}
                {needsOutsidePlan && (
                  <>
                    <div style={styles.hint}>{t(msg('This time is outside the suggested window. Why?'))}</div>
                    <RadioGroup
                      orientation="horizontal"
                      aria-label={t(msg('Reason for a time outside the plan'))}
                      value={outsidePlanReason}
                      onValueChange={(value) => setOutsidePlanReason(value as string)}
                      style={styles.wrap}
                    >
                      <Radio value="USER_REQUEST" style={{ ...styles.pill, ...(outsidePlanReason === 'USER_REQUEST' ? styles.pillChecked : {}) }}>
                        {t(msg('User request'))}
                      </Radio>
                      <Radio value="ADMIN_DECISION" style={{ ...styles.pill, ...(outsidePlanReason === 'ADMIN_DECISION' ? styles.pillChecked : {}) }}>
                        {t(msg('Admin decision'))}
                      </Radio>
                    </RadioGroup>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {showCodes && (
          <div style={styles.section}>
            <SectionLabel note={preparation.campaignName === null ? t(msg('(optional)')) : t(msg('(optional, codes of {campaign})'), { campaign: preparation.campaignName })}>
              {t(msg('Activate a code'))}
            </SectionLabel>
            {preparation.codes.map((offered) => (
              <label key={offered.id} style={styles.codeRow}>
                <Checkbox
                  disabled={offered.activated}
                  checked={offered.activated || codeIds.includes(offered.id)}
                  onCheckedChange={() => setCodeIds(toggle(codeIds, offered.id))}
                />
                <span style={styles.grow}>{offered.code}</span>
                <span style={styles.hint}>
                  {offered.activated
                    ? t(msg('Activated for this user, until {expiry}'), { expiry: formatDay(tehranDay(new Date(offered.expiresAt)), locale, { day: 'numeric', month: 'long' }) })
                    : t(msg('{capability} · until {expiry}'), {
                        capability: CAPABILITY_LABELS[offered.capability] ? t(CAPABILITY_LABELS[offered.capability]) : offered.capability,
                        expiry: `${formatDay(tehranDay(new Date(offered.expiresAt)), locale, { day: 'numeric', month: 'long' })} ${formatTime(new Date(offered.expiresAt), locale)}`,
                      })}
                </span>
              </label>
            ))}
            <div style={styles.hint}>{t(msg('Saving activates the code right away and sends an SMS with the code, its feature and its expiry.'))}</div>
          </div>
        )}

        {technicalStatus !== null && reasonsOfKind('DO_NOT_CONTACT').length > 0 && (
          <div style={styles.section}>
            <SectionLabel>{t(msg('Move to permanently failed'))}</SectionLabel>
            <Select.Root value={doNotContactReasonId} onValueChange={(value) => setDoNotContactReasonId((value as string | null) ?? null)}>
              <Select.Trigger aria-label={t(msg('Permanent failure reason'))}>
                <Select.Value placeholder={t(msg('Choose a reason'))}>
                  {(value: string | null) => reasonsOfKind('DO_NOT_CONTACT').find((reason) => reason.id === value)?.name ?? t(msg('Choose a reason'))}
                </Select.Value>
                <Select.Icon />
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner sideOffset={4} align="start">
                  <Select.Popup>
                    <Select.Item value={null}>
                      <Select.ItemText>{t(msg('Keep following up'))}</Select.ItemText>
                    </Select.Item>
                    {reasonsOfKind('DO_NOT_CONTACT').map((reason) => (
                      <Select.Item key={reason.id} value={reason.id}>
                        <Select.ItemText>{reason.name}</Select.ItemText>
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
            {doNotContact && (
              <Callout
                status="warning"
                title={t(msg('This cannot be undone.'))}
                description={t(msg('This removes the next call and takes the user out of every list for good.'))}
              />
            )}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <Button variant="outline" color="neutral" onClick={closeFormPanel} disabled={submitting}>
          {t(msg('Cancel'))}
        </Button>
        <Button variant="solid" color="accent" onClick={save} disabled={!canSave} loading={submitting}>
          {t(msg('Save'))}
        </Button>
      </div>
    </>,
  );
};

export default defineFrontComponent({
  universalIdentifier: LOG_CALL_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'log-call',
  description: 'Side-panel form that saves a call with its outcome, reasons, next call, codes and note.',
  component: LogCallForm,
});
