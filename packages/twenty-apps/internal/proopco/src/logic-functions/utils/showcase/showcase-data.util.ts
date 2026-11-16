import { DAY_MS, HOUR_MS } from 'src/constants/time.constant';
import { type PlatformEvent } from 'src/logic-functions/utils/parse-platform-envelope.util';

// Every showcase row carries one of these tags so Clear finds exactly what Seed made.
export const SHOWCASE_NAME_PREFIX = 'Showcase · ';
export const SHOWCASE_PLATFORM_USER_PREFIX = 'showcase_';
export const SHOWCASE_CODE_PREFIX = 'SHOWCASE-';

export const SHOWCASE_CONTACT_COUNT = 30;
export const MAX_SHOWCASE_AGENTS = 3;

const FIRST_NAMES = ['علی', 'مریم', 'رضا', 'زهرا', 'حسین', 'فاطمه', 'محمد', 'سارا', 'امیر', 'نگار'];
const LAST_NAMES = ['رضایی', 'احمدی', 'کریمی', 'حسینی', 'موسوی', 'جعفری', 'صادقی', 'نوری', 'یزدانی'];
const SOURCES = ['website', 'telegram', 'zoomit'];
const KYC = ['confirmed', 'pending', 'none', 'confirmed'];
const STAGES = ['step_1', 'step_2', 'funded', null];

export const newShowcaseRunId = () => Math.random().toString(36).slice(2, 7);

export const platformUserIdOf = (runId: string, index: number) =>
  `${SHOWCASE_PLATFORM_USER_PREFIX}${runId}_${index}`;

export const runIdOfPlatformUserId = (platformUserId: string) =>
  platformUserId.slice(SHOWCASE_PLATFORM_USER_PREFIX.length).split('_')[0];

// Segment rules match on this country text, so real contacts never fall into a showcase campaign.
export const showcaseCountryOf = (runId: string, group: 'A' | 'B') =>
  `${group === 'A' ? 'IR' : 'AE'}-SHOWCASE-${runId}`;

export const groupOf = (index: number): 'A' | 'B' => (index % 2 === 0 ? 'A' : 'B');

export const showcaseCodeOf = (runId: string, suffix: string) =>
  `${SHOWCASE_CODE_PREFIX}${runId.toUpperCase()}-${suffix}`;

export const showcaseKey = (runId: string, ...parts: (string | number)[]) =>
  ['showcase', runId, ...parts].join('-');

export const contactEventOf = (runId: string, index: number, at: Date): PlatformEvent => {
  const purchaseCount = index % 4 === 0 ? 1 : 0;

  return {
    eventId: showcaseKey(runId, 'contact', index),
    type: 'contact.upserted',
    schemaVersion: '1.0',
    occurredAt: at.toISOString(),
    data: {
      platformUserId: platformUserIdOf(runId, index),
      updatedAt: at.toISOString(),
      firstName: FIRST_NAMES[index % FIRST_NAMES.length],
      lastName: LAST_NAMES[index % LAST_NAMES.length],
      phone: `+98912${String(1_000_000 + index * 7919).slice(-7)}`,
      email: `showcase.${runId}.${index}@example.com`,
      signupAt: new Date(at.getTime() - (90 + index * 3) * DAY_MS).toISOString(),
      hasPhone: true,
      country: showcaseCountryOf(runId, groupOf(index)),
      registrationSource: SOURCES[index % SOURCES.length],
      kycStatus: KYC[index % KYC.length],
      birthDate: `${1985 + (index % 15)}-0${1 + (index % 9)}-1${index % 10}`,
      activeAccountCount: 1 + (index % 3),
      purchaseCount,
      lastPurchaseAt: purchaseCount > 0 ? new Date(at.getTime() - 120 * DAY_MS).toISOString() : null,
      totalPaidUsdt: purchaseCount > 0 ? '199.00' : '0.00',
      currentStage: STAGES[index % STAGES.length],
      lastChallengeFailedAt: index % 3 === 0 ? new Date(at.getTime() - 20 * DAY_MS).toISOString() : null,
      failedChallengeCount: index % 3 === 0 ? 1 : 0,
      hasProfitWithdrawal: index % 5 === 0,
      isReferred: index % 4 === 1,
      lastLoginAt: new Date(at.getTime() - (index % 7) * DAY_MS).toISOString(),
    },
  };
};

export const purchaseEventOf = (
  runId: string,
  key: string,
  platformUserId: string,
  amountUsdt: string,
  codeUsed: string | null,
  at: Date,
): PlatformEvent => ({
  eventId: showcaseKey(runId, 'purchase', key),
  type: 'purchase.settled',
  schemaVersion: '1.0',
  occurredAt: at.toISOString(),
  data: { purchaseId: showcaseKey(runId, 'p', key), platformUserId, amountUsdt, codeUsed },
});

export const lastLostEventOf = (runId: string, index: number, at: Date): PlatformEvent => ({
  eventId: showcaseKey(runId, 'last-lost', index),
  type: 'account.last_lost',
  schemaVersion: '1.0',
  occurredAt: at.toISOString(),
  data: { platformUserId: platformUserIdOf(runId, index) },
});

export type ShowcaseCall =
  | { at: number; status: 'NO_ANSWER'; nextAt: number }
  | { at: number; status: 'ANSWERED'; nextAt: number; withCode?: 'CAMPAIGN' | 'RETENTION' }
  | { at: number; status: 'ANSWERED'; doNotContact: true }
  | { at: number; status: 'ANSWERED'; retentionDone: true; withCode?: 'RETENTION' };

export type ShowcaseScript = {
  index: number;
  claimAt: number;
  calls: ShowcaseCall[];
  purchase?: { at: number; amountUsdt: string; withCode?: boolean };
  lastLostAt?: number;
  retentionCall?: ShowcaseCall;
  transferAt?: number;
  releaseAt?: number;
};

// Offsets are milliseconds relative to the real now; deals that must still be open end up with a future deadline.
const days = (count: number) => count * DAY_MS;
const hours = (count: number) => count * HOUR_MS;

export const SHOWCASE_SCRIPTS: ShowcaseScript[] = [
  { index: 0, claimAt: -hours(1), calls: [] },
  { index: 1, claimAt: -hours(2), calls: [] },
  { index: 2, claimAt: -days(4), calls: [{ at: -days(3), status: 'ANSWERED', nextAt: days(1) }] },
  { index: 3, claimAt: -days(4), calls: [{ at: -days(3), status: 'ANSWERED', nextAt: days(2) }] },
  {
    index: 4,
    claimAt: -days(5),
    calls: [
      { at: -days(4), status: 'NO_ANSWER', nextAt: -days(3) - hours(1) },
      { at: -days(3), status: 'ANSWERED', nextAt: -hours(2) },
    ],
  },
  {
    index: 5,
    claimAt: -days(5),
    calls: [
      { at: -days(4), status: 'NO_ANSWER', nextAt: -days(3) - hours(1) },
      { at: -days(3), status: 'ANSWERED', nextAt: hours(3) },
    ],
  },
  {
    index: 6,
    claimAt: -days(40),
    calls: [{ at: -days(39), status: 'ANSWERED', nextAt: -days(37), withCode: 'CAMPAIGN' }],
    purchase: { at: -days(36), amountUsdt: '450.00', withCode: true },
  },
  {
    index: 7,
    claimAt: -days(40),
    calls: [{ at: -days(39), status: 'ANSWERED', nextAt: -days(37) }],
    purchase: { at: -days(36) + hours(5), amountUsdt: '800.00' },
  },
  {
    index: 8,
    claimAt: -days(35),
    calls: [{ at: -days(34), status: 'ANSWERED', nextAt: -days(33) }],
    purchase: { at: -days(33) + hours(2), amountUsdt: '1200.00' },
    // Retention calls happen while a Customer; losing the last account then opens the rebuy window.
    retentionCall: { at: -days(10), status: 'ANSWERED', retentionDone: true, withCode: 'RETENTION' },
    lastLostAt: -days(1),
  },
  {
    index: 9,
    claimAt: -days(3),
    calls: [{ at: -days(2), status: 'ANSWERED', nextAt: days(1) }],
    purchase: { at: -days(1), amountUsdt: '300.00' },
  },
  { index: 10, claimAt: -days(20), calls: [{ at: -days(19), status: 'NO_ANSWER', nextAt: -days(18) }] },
  { index: 11, claimAt: -days(20), calls: [{ at: -days(19), status: 'NO_ANSWER', nextAt: -days(17) }] },
  { index: 12, claimAt: -days(10), calls: [{ at: -days(9), status: 'ANSWERED', doNotContact: true }] },
  { index: 13, claimAt: -days(6), calls: [{ at: -days(5), status: 'ANSWERED', nextAt: days(1) }], transferAt: -days(1) },
  { index: 14, claimAt: -days(6), calls: [], releaseAt: -days(1) },
  { index: 16, claimAt: -days(2), calls: [{ at: -days(1), status: 'ANSWERED', nextAt: days(2), withCode: 'CAMPAIGN' }] },
  { index: 17, claimAt: -days(3), calls: [{ at: -days(2), status: 'NO_ANSWER', nextAt: days(1) }] },
];

// Contact 15 buys while nobody owns it; contact 17 belongs to the agent that ends up frozen.
export const UNATTRIBUTED_PURCHASE_INDEX = 15;
export const FROZEN_AGENT_CONTACT_INDEX = 17;
