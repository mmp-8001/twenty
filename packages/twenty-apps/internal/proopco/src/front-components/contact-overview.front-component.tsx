import 'twenty-ui/style.css';
import 'twenty-ui/theme-dark.css';
import 'twenty-ui/theme-light.css';

import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineFrontComponent, PageLayoutType } from 'twenty-sdk/define';
import {
  AppPath,
  msg,
  openSidePanelPage,
  useColorScheme,
  useRecordId,
  useTranslate,
} from 'twenty-sdk/front-component';
import { Tag } from 'twenty-ui/primitives/data-display';
import { Skeleton } from 'twenty-ui/primitives/feedback';
import { Button } from 'twenty-ui/primitives/input';
import { THEME_DARK, THEME_LIGHT, ThemeProvider, type ThemeColor } from 'twenty-ui/theme';

import { DAY_MS } from 'src/constants/time.constant';
import { CONTACT_OVERVIEW_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { clockOfDeal, loadOpenDeal } from 'src/logic-functions/utils/deal.util';
import { listRecords } from 'src/logic-functions/utils/records.util';
import { type DealClock, slotWindowsOf } from 'src/utils/deal-clock.util';

type Connection<TNode> = { edges?: { node: TNode }[] };
type CallRow = {
  id: string;
  calledAt: string | null;
  technicalStatus: string | null;
  answered: boolean | null;
  note: string | null;
  otherReasonText: string | null;
  agent: { name: string | null } | null;
  callReasons: Connection<{ reason: { name: string } | null }>;
};
type CodeActivationRow = {
  id: string;
  status: string | null;
  smsStatus: string | null;
  activatedAt: string | null;
  usedAt: string | null;
  code: { code: string; capability: string | null; expiresAt: string | null } | null;
};
type PurchaseRow = { id: string; name: string | null; occurredAt: string | null; amountUsdt: number | null; codeText: string | null };
type ContactRow = {
  id: string;
  lifecycleStage: string | null;
  planProgress: string | null;
  sourceCampaign: { name: string } | null;
  signupAt: string | null;
  kycStatus: string | null;
  purchaseCount: number | null;
  totalPaidUsdt: number | null;
  activeAccountCount: number | null;
  failedChallengeCount: number | null;
  lastChallengeFailedAt: string | null;
  hasProfitWithdrawal: boolean | null;
  lastLoginAt: string | null;
  codeActivations: Connection<CodeActivationRow>;
  purchases: Connection<PurchaseRow>;
};
type Overview = { contact: ContactRow; calls: CallRow[]; clock: DealClock | null };
type Label = ReturnType<typeof msg>;
type Badge = { label: Label; color: ThemeColor };

const RELATED_LIMIT = 100;

const STAGE_LABELS: Record<string, Label> = {
  FREE: msg('Free'),
  AWAITING_FIRST_CALL: msg('Awaiting first call'),
  IN_FOLLOW_UP: msg('In follow-up'),
  CUSTOMER: msg('Customer'),
  REBUY_WINDOW: msg('Rebuy window'),
  COOL_DOWN: msg('Cool-down'),
  DO_NOT_CONTACT: msg('Do not contact'),
};

const KYC_LABELS: Record<string, Label> = {
  NONE: msg('None'),
  PENDING: msg('Pending'),
  CONFIRMED: msg('Confirmed'),
  REJECTED: msg('Rejected'),
};

const CALL_STATUS_BADGES: Record<string, Badge> = {
  ANSWERED: { label: msg('They answered'), color: 'green' },
  NO_ANSWER: { label: msg('No answer'), color: 'amber' },
  BUSY: { label: msg('Busy'), color: 'orange' },
  SWITCHED_OFF: { label: msg('Switched off'), color: 'gray' },
  REJECTED: { label: msg('Rejected'), color: 'red' },
  INVALID_NUMBER: { label: msg('Invalid number'), color: 'red' },
};

const CAPABILITY_LABELS: Record<string, Label> = {
  DISCOUNT: msg('Discount'),
  RESET: msg('Reset'),
  TWO_STEP_PAYMENT: msg('Two-step payment'),
};

const SLOT_BADGES: Record<'DONE' | 'MISSED' | 'MOVED' | 'FUTURE', Badge> = {
  DONE: { label: msg('Done'), color: 'green' },
  MISSED: { label: msg('Missed'), color: 'red' },
  MOVED: { label: msg('Moved'), color: 'gray' },
  FUTURE: { label: msg('Upcoming'), color: 'gray' },
};

const CONTACT_SELECTION = {
  lifecycleStage: true,
  planProgress: true,
  sourceCampaign: { name: true },
  signupAt: true,
  kycStatus: true,
  purchaseCount: true,
  totalPaidUsdt: true,
  activeAccountCount: true,
  failedChallengeCount: true,
  lastChallengeFailedAt: true,
  hasProfitWithdrawal: true,
  lastLoginAt: true,
  codeActivations: {
    __args: { first: RELATED_LIMIT },
    edges: {
      node: {
        id: true,
        status: true,
        smsStatus: true,
        activatedAt: true,
        usedAt: true,
        code: { code: true, capability: true, expiresAt: true },
      },
    },
  },
  purchases: {
    __args: { first: RELATED_LIMIT },
    edges: { node: { id: true, name: true, occurredAt: true, amountUsdt: true, codeText: true } },
  },
};

const CALL_SELECTION = {
  calledAt: true,
  technicalStatus: true,
  answered: true,
  note: true,
  otherReasonText: true,
  agent: { name: true },
  callReasons: { edges: { node: { reason: { name: true } } } },
};

const nodesOf = <TNode,>(connection: Connection<TNode> | undefined) => (connection?.edges ?? []).map(({ node }) => node);
const newestFirst = <TNode,>(rows: TNode[], dateOf: (row: TNode) => string | null) =>
  [...rows].sort((left, right) => (dateOf(right) ?? '').localeCompare(dateOf(left) ?? ''));

const intlLocale = (locale: string) => `${locale === 'fa-IR' ? 'fa-IR' : 'en'}-u-ca-persian`;
const formatAt = (iso: string, locale: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(intlLocale(locale), { timeZone: 'Asia/Tehran', ...options }).format(new Date(iso));
const formatDate = (iso: string, locale: string) => formatAt(iso, locale, { day: 'numeric', month: 'long', year: 'numeric' });
const formatShortDate = (iso: string, locale: string) => formatAt(iso, locale, { day: 'numeric', month: 'long' });
const formatDateTime = (iso: string, locale: string) =>
  formatAt(iso, locale, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false });
const formatNumber = (value: number, locale: string) => new Intl.NumberFormat(intlLocale(locale)).format(value);

const openRecord = (objectNameSingular: string, objectRecordId: string) =>
  openSidePanelPage({ to: AppPath.RecordShowPage, params: { objectNameSingular, objectRecordId } });

const styles: Record<string, CSSProperties> = {
  container: {
    fontFamily: 'var(--t-font-family)',
    fontSize: 'var(--t-font-size-sm)',
    color: 'var(--t-font-color-primary)',
    background: 'var(--t-background-primary)',
    padding: 'var(--t-spacing-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--t-spacing-4)',
    boxSizing: 'border-box',
    height: '100%',
    overflowY: 'auto',
  },
  badges: { display: 'flex', flexWrap: 'wrap', gap: 'var(--t-spacing-2)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--t-spacing-4)', alignItems: 'start' },
  card: {
    border: '1px solid var(--t-border-color-medium)',
    borderRadius: 'var(--t-border-radius-md)',
    padding: 'var(--t-spacing-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--t-spacing-3)',
  },
  cardTitle: { margin: 0, fontSize: 'var(--t-font-size-md)', fontWeight: 'var(--t-font-weight-semi-bold)' },
  hint: { color: 'var(--t-font-color-tertiary)', fontSize: 'var(--t-font-size-xs)' },
  slots: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 'var(--t-spacing-2)' },
  slot: {
    border: '1px solid var(--t-border-color-medium)',
    borderRadius: 'var(--t-border-radius-md)',
    padding: 'var(--t-spacing-2) var(--t-spacing-3)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--t-spacing-1)',
    alignItems: 'flex-start',
  },
  slotCurrent: { borderColor: 'var(--t-color-blue)', boxShadow: '0 0 0 1px var(--t-color-blue)' },
  strong: { fontWeight: 'var(--t-font-weight-semi-bold)' },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--t-spacing-3)',
    padding: 'var(--t-spacing-2) 0',
    borderTop: '1px solid var(--t-border-color-light)',
  },
  rowMain: { flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--t-spacing-1)', minWidth: 0 },
  info: { display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 'var(--t-spacing-4)', rowGap: 'var(--t-spacing-2)' },
  infoLabel: { color: 'var(--t-font-color-tertiary)' },
};

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section style={styles.card}>
    <h3 style={styles.cardTitle}>{title}</h3>
    {children}
  </section>
);

const ContactOverview = () => {
  const personId = useRecordId();
  const { t, locale } = useTranslate();
  const colorScheme = useColorScheme();
  const [now] = useState(() => new Date());
  const [overview, setOverview] = useState<Overview | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (personId === null) {
      return;
    }

    const client = new CoreApiClient();

    Promise.all([
      listRecords<ContactRow>(client, 'people', { id: { eq: personId } }, CONTACT_SELECTION, 1),
      // Calls load on their own: a one-to-many (call reasons) cannot nest under another (person calls).
      listRecords<CallRow>(client, 'calls', { contactId: { eq: personId } }, CALL_SELECTION, RELATED_LIMIT),
      loadOpenDeal(client, personId),
    ])
      .then(([[contact], calls, deal]) => {
        if (contact === undefined) {
          setFailed(true);

          return;
        }

        setOverview({ contact, calls, clock: deal === null || deal.dealStage === 'REBUY_WINDOW' ? null : clockOfDeal(deal) });
      })
      .catch(() => setFailed(true));
  }, [personId]);

  const theme = colorScheme === 'dark' ? THEME_DARK : THEME_LIGHT;

  if (overview === null) {
    return (
      <ThemeProvider colorScheme={colorScheme} theme={theme}>
        <div style={styles.container}>
          {failed ? <span style={styles.hint}>{t(msg('Could not load this contact.'))}</span> : <Skeleton style={{ height: 240 }} />}
        </div>
      </ThemeProvider>
    );
  }

  const { contact, clock } = overview;
  const calls = newestFirst(overview.calls, (call) => call.calledAt);
  const activations = newestFirst(nodesOf(contact.codeActivations), (activation) => activation.activatedAt);
  const purchases = newestFirst(nodesOf(contact.purchases), (purchase) => purchase.occurredAt);
  const stageLabel = contact.lifecycleStage === null ? undefined : STAGE_LABELS[contact.lifecycleStage];
  const dash = '—';
  const dateOrDash = (iso: string | null) => (iso === null ? dash : formatDate(iso, locale));

  const planCard = () => {
    if (clock === null) {
      return null;
    }

    const windows = slotWindowsOf(clock);

    if (windows.length === 0) {
      return (
        <Card title={t(msg('Call plan (5 attempts)'))}>
          <span style={styles.hint}>{t(msg('The plan starts with the first answered call.'))}</span>
        </Card>
      );
    }

    const anchor = windows[0].startsAt.getTime();

    return (
      <Card title={t(msg('Call plan (5 attempts)'))}>
        <div style={styles.slots}>
          {windows.map(({ slot, startsAt, endsAt }) => {
            const status = clock.slots[slot - 1];
            const isCurrent = startsAt <= now && now < endsAt;
            const firstDay = Math.round((startsAt.getTime() - anchor) / DAY_MS);
            const lastDay = Math.max(firstDay, Math.round((endsAt.getTime() - anchor) / DAY_MS) - 1);
            const unanswered = calls.filter(
              (call) => call.calledAt !== null && call.answered !== true && new Date(call.calledAt) >= startsAt && new Date(call.calledAt) < endsAt,
            ).length;
            const badge: Badge =
              status !== 'PENDING'
                ? SLOT_BADGES[status]
                : endsAt <= now
                  ? SLOT_BADGES.MISSED
                  : startsAt > now
                    ? SLOT_BADGES.FUTURE
                    : { label: msg('Open'), color: 'amber' };

            return (
              <div key={slot} style={{ ...styles.slot, ...(isCurrent ? styles.slotCurrent : {}) }}>
                <span style={styles.strong}>{t(msg('Attempt {slot}'), { slot: formatNumber(slot, locale) })}</span>
                <span style={styles.hint}>
                  {firstDay === lastDay
                    ? t(msg('Day {day}'), { day: formatNumber(firstDay, locale) })
                    : t(msg('Days {from} to {to}'), { from: formatNumber(firstDay, locale), to: formatNumber(lastDay, locale) })}
                </span>
                <Tag color={badge.color} variant="soft">
                  {t(badge.label)}
                  {isCurrent && status === 'PENDING' && unanswered > 0
                    ? ` · ${t(msg('{count} unanswered'), { count: formatNumber(unanswered, locale) })}`
                    : ''}
                </Tag>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <ThemeProvider colorScheme={colorScheme} theme={theme}>
      <div style={styles.container}>
        <div style={styles.badges}>
          {stageLabel !== undefined && <Tag color="blue" variant="soft">{t(stageLabel)}</Tag>}
          {contact.sourceCampaign !== null && <Tag color="gray" variant="soft">{contact.sourceCampaign.name}</Tag>}
          {contact.planProgress !== null && <Tag color="amber" variant="soft">{contact.planProgress}</Tag>}
        </div>

        {planCard()}

        <div style={styles.grid}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--t-spacing-4)' }}>
            <Card title={t(msg('Call history'))}>
              {calls.length === 0 && <span style={styles.hint}>{t(msg('No calls yet.'))}</span>}
              {calls.map((call) => {
                const badge = call.technicalStatus === null ? undefined : CALL_STATUS_BADGES[call.technicalStatus];
                const reasons = [
                  ...nodesOf(call.callReasons).flatMap(({ reason }) => (reason === null ? [] : [reason.name])),
                  ...(call.otherReasonText ? [call.otherReasonText] : []),
                ];

                return (
                  <div key={call.id} style={{ ...styles.row, flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--t-spacing-2)' }}>
                      <span style={styles.strong}>{call.calledAt === null ? dash : formatDateTime(call.calledAt, locale)}</span>
                      <span style={styles.hint}>{call.agent?.name ?? dash}</span>
                      {badge !== undefined && <Tag color={badge.color} variant="soft">{t(badge.label)}</Tag>}
                      <span style={{ flex: 1 }} />
                      <Button variant="outline" color="neutral" size="sm" onClick={() => openRecord('call', call.id)}>
                        {t(msg('Edit note'))}
                      </Button>
                    </div>
                    <span>{call.note || dash}</span>
                    {reasons.length > 0 && <span style={styles.hint}>{reasons.join(' · ')}</span>}
                  </div>
                );
              })}
            </Card>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--t-spacing-4)' }}>
            <Card title={t(msg('Platform info'))}>
              <div style={styles.info}>
                <span style={styles.infoLabel}>{t(msg('Signed up'))}</span>
                <span>{dateOrDash(contact.signupAt)}</span>
                <span style={styles.infoLabel}>{t(msg('KYC'))}</span>
                <span>{contact.kycStatus !== null && KYC_LABELS[contact.kycStatus] ? t(KYC_LABELS[contact.kycStatus]) : dash}</span>
                <span style={styles.infoLabel}>{t(msg('Purchases'))}</span>
                <span>
                  {t(msg('{count} · {total} USDT'), {
                    count: formatNumber(contact.purchaseCount ?? 0, locale),
                    total: formatNumber(contact.totalPaidUsdt ?? 0, locale),
                  })}
                </span>
                <span style={styles.infoLabel}>{t(msg('Active accounts'))}</span>
                <span>{formatNumber(contact.activeAccountCount ?? 0, locale)}</span>
                <span style={styles.infoLabel}>{t(msg('Last failed challenge'))}</span>
                <span>
                  {contact.lastChallengeFailedAt === null
                    ? dash
                    : `${formatDate(contact.lastChallengeFailedAt, locale)} · ${t(msg('{count} failed'), { count: formatNumber(contact.failedChallengeCount ?? 0, locale) })}`}
                </span>
                <span style={styles.infoLabel}>{t(msg('Profit withdrawal'))}</span>
                <span>{contact.hasProfitWithdrawal ? t(msg('Yes')) : t(msg('No'))}</span>
                <span style={styles.infoLabel}>{t(msg('Last login'))}</span>
                <span>{dateOrDash(contact.lastLoginAt)}</span>
              </div>
            </Card>

            <Card title={t(msg('Purchases'))}>
              {purchases.length === 0 && <span style={styles.hint}>{t(msg('No purchases yet.'))}</span>}
              {purchases.map((purchase) => (
                <div key={purchase.id} style={styles.row}>
                  <div style={styles.rowMain}>
                    <span>{purchase.name ?? dash}</span>
                    <span style={styles.hint}>
                      {[purchase.occurredAt === null ? null : formatDate(purchase.occurredAt, locale), purchase.codeText]
                        .filter((part) => part)
                        .join(' · ')}
                    </span>
                  </div>
                  {purchase.amountUsdt !== null && (
                    <Tag color="gray" variant="soft">{`${formatNumber(purchase.amountUsdt, locale)} USDT`}</Tag>
                  )}
                </div>
              ))}
            </Card>
          </div>
        </div>

        <Card title={t(msg('Discount codes'))}>
          {activations.length === 0 && <span style={styles.hint}>{t(msg('No codes activated yet.'))}</span>}
          {activations.map((activation) => {
            const capability = activation.code?.capability ? CAPABILITY_LABELS[activation.code.capability] : undefined;
            const expiresAt = activation.code?.expiresAt ?? null;
            const smsMissing = activation.status === 'ACTIVE' && activation.smsStatus !== 'SENT';
            const badge: Badge =
              activation.status === 'FAILED'
                ? { label: msg('Activation failed'), color: 'red' }
                : smsMissing
                  ? { label: msg('SMS not sent'), color: 'amber' }
                  : activation.status === 'USED'
                    ? { label: msg('Used'), color: 'purple' }
                    : activation.status === 'DEACTIVATED'
                      ? { label: msg('Deactivated'), color: 'gray' }
                      : activation.status === 'PENDING'
                        ? { label: msg('Pending'), color: 'blue' }
                        : { label: msg('Active'), color: 'green' };
            const action =
              activation.status === 'FAILED' ? msg('Retry') : smsMissing ? msg('Resend SMS') : null;

            return (
              <div key={activation.id} style={styles.row}>
                <div style={styles.rowMain}>
                  <span style={styles.strong}>
                    {[activation.code?.code, capability === undefined ? null : t(capability)].filter((part) => part).join(' · ')}
                  </span>
                  <span style={styles.hint}>
                    {[
                      activation.activatedAt === null ? null : t(msg('Activated {date}'), { date: formatShortDate(activation.activatedAt, locale) }),
                      expiresAt === null ? null : t(msg('Until {date}'), { date: formatShortDate(expiresAt, locale) }),
                    ]
                      .filter((part) => part)
                      .join(' · ')}
                  </span>
                </div>
                <Tag color={badge.color} variant="soft">{t(badge.label)}</Tag>
                {action !== null && (
                  <Button variant="outline" color="neutral" size="sm" onClick={() => openRecord('codeActivation', activation.id)}>
                    {t(action)}
                  </Button>
                )}
              </div>
            );
          })}
        </Card>
      </div>
    </ThemeProvider>
  );
};

export default defineFrontComponent({
  universalIdentifier: CONTACT_OVERVIEW_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'contact-overview',
  description: 'Person record tab: call plan, call history, platform info, purchases and discount codes in one view.',
  component: ContactOverview,
  widgetAvailability: { pageLayoutType: PageLayoutType.RECORD_PAGE },
});
