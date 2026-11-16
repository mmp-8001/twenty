import {
  AWAITING_FIRST_CALL_DAYS,
  DAY_MS,
  FOLLOW_UP_DAYS,
  HOUR_MS,
} from 'src/constants/time.constant';
import { startOfTehranDay } from 'src/utils/tehran-day.util';

// Logic functions have no viewer locale and every member works in Persian, so stored text is written in Persian.
const persianNumber = (value: number) => value.toLocaleString('fa-IR');

export const FROZEN_PLAN_PROGRESS = 'مسدود';

export type SlotStatus = 'PENDING' | 'DONE' | 'MISSED' | 'MOVED';
export type DealStage = 'AWAITING_FIRST_CALL' | 'IN_FOLLOW_UP' | 'REBUY_WINDOW';
export type CallUrgency = 'LATER' | 'TODAY' | 'DUE' | 'OVERDUE';

export type DealClock = {
  stage: 'AWAITING_FIRST_CALL' | 'IN_FOLLOW_UP';
  openedAt: Date;
  firstAnsweredCallAt: Date | null;
  frozenMs: number;
  deadlineAt: Date;
  slots: SlotStatus[];
};

export type SlotWindow = { slot: number; startsAt: Date; endsAt: Date };

// Day n is n x 24h after the anchor: slot 1 is the first answered call's day, then days 1-3, 4-7, 8-15, 16 to the deadline.
const SLOT_START_DAYS = [0, 1, 4, 8, 16];

export const buildSlotWindows = (
  anchor: Date,
  deadlineAt: Date,
): SlotWindow[] =>
  SLOT_START_DAYS.map((startDay, index) => ({
    slot: index + 1,
    startsAt: new Date(anchor.getTime() + startDay * DAY_MS),
    endsAt: new Date(
      Math.min(
        index + 1 < SLOT_START_DAYS.length
          ? anchor.getTime() + SLOT_START_DAYS[index + 1] * DAY_MS
          : deadlineAt.getTime(),
        deadlineAt.getTime(),
      ),
    ),
  })).filter(({ startsAt }) => startsAt.getTime() < deadlineAt.getTime());

export const slotWindowsOf = (clock: DealClock): SlotWindow[] =>
  clock.firstAnsweredCallAt === null
    ? []
    : buildSlotWindows(
        new Date(clock.firstAnsweredCallAt.getTime() + clock.frozenMs),
        clock.deadlineAt,
      );

const windowContaining = (windows: SlotWindow[], at: Date) =>
  windows.find(
    ({ startsAt, endsAt }) => startsAt <= at && at < endsAt,
  );

export type AppliedCall = {
  clock: DealClock;
  slotNumber: number | null;
  completedSlot: number | null;
};

export const applyCall = (
  clock: DealClock,
  { now, answered }: { now: Date; answered: boolean },
): AppliedCall => {
  if (answered && clock.firstAnsweredCallAt === null) {
    const isAwaiting = clock.stage === 'AWAITING_FIRST_CALL';

    return {
      clock: {
        ...clock,
        stage: 'IN_FOLLOW_UP',
        firstAnsweredCallAt: now,
        deadlineAt: isAwaiting
          ? new Date(now.getTime() + FOLLOW_UP_DAYS * DAY_MS + clock.frozenMs)
          : clock.deadlineAt,
        slots: ['DONE', 'PENDING', 'PENDING', 'PENDING', 'PENDING'],
      },
      slotNumber: 1,
      completedSlot: 1,
    };
  }

  const current = windowContaining(slotWindowsOf(clock), now);
  const slotNumber = current?.slot ?? null;

  if (!answered || current === undefined || clock.slots[current.slot - 1] !== 'PENDING') {
    return { clock, slotNumber, completedSlot: null };
  }

  const slots = [...clock.slots];

  slots[current.slot - 1] = 'DONE';

  return { clock: { ...clock, slots }, slotNumber, completedSlot: current.slot };
};

const pendingWindows = (clock: DealClock, now: Date) =>
  slotWindowsOf(clock).filter(
    ({ slot, endsAt }) => clock.slots[slot - 1] === 'PENDING' && endsAt > now,
  );

const cappedAtDeadline = (at: Date, clock: DealClock) =>
  new Date(Math.min(at.getTime(), clock.deadlineAt.getTime()));

// `clock` is the state after the call; `kind` RETENTION has no deal.
export const defaultNextCallAt = ({
  now,
  answered,
  clock,
}: {
  now: Date;
  answered: boolean;
  clock: DealClock | null;
}): Date | null => {
  const inHours = (hours: number) => new Date(now.getTime() + hours * HOUR_MS);

  if (clock === null) {
    return answered ? null : inHours(24);
  }

  if (clock.firstAnsweredCallAt === null) {
    return cappedAtDeadline(inHours(24), clock);
  }

  const windows = slotWindowsOf(clock);

  if (answered) {
    const [next] = pendingWindows(clock, now);

    if (next === undefined) {
      return cappedAtDeadline(inHours(24), clock);
    }

    return cappedAtDeadline(next.startsAt > now ? next.startsAt : inHours(1), clock);
  }

  const current = windowContaining(windows, now);

  for (const hours of [24, 2]) {
    if (current !== undefined && inHours(hours) < current.endsAt) {
      return cappedAtDeadline(inHours(hours), clock);
    }
  }

  const upcoming = windows.find(({ startsAt }) => startsAt > now);

  return cappedAtDeadline(upcoming?.startsAt ?? inHours(2), clock);
};

// A time after the next pending window ends needs an outside-plan reason.
export const requiresOutsidePlanReason = (
  clock: DealClock | null,
  now: Date,
  nextCallAt: Date,
): boolean => {
  const [target] = clock === null ? [] : pendingWindows(clock, now);

  return target !== undefined && nextCallAt >= target.endsAt;
};

export const slotsEndingBefore = (
  clock: DealClock,
  now: Date,
  nextCallAt: Date,
): number[] =>
  pendingWindows(clock, now)
    .filter(({ endsAt }) => endsAt <= nextCallAt)
    .map(({ slot }) => slot);

export const urgencyOf = (
  nextCallAt: Date | null,
  now: Date,
): CallUrgency | null => {
  if (nextCallAt === null) {
    return null;
  }

  const sameDay =
    startOfTehranDay(nextCallAt).getTime() === startOfTehranDay(now).getTime();

  if (nextCallAt > now) {
    return sameDay ? 'TODAY' : 'LATER';
  }

  return sameDay && now.getTime() < nextCallAt.getTime() + 2 * HOUR_MS
    ? 'DUE'
    : 'OVERDUE';
};

const dayOf = (from: Date, now: Date, total: number) =>
  Math.min(Math.max(Math.floor((now.getTime() - from.getTime()) / DAY_MS) + 1, 1), total);

export const planProgressOf = (clock: DealClock, now: Date): string => {
  if (clock.firstAnsweredCallAt !== null) {
    const anchor = new Date(clock.firstAnsweredCallAt.getTime() + clock.frozenMs);
    const windows = slotWindowsOf(clock);
    const slot =
      windowContaining(windows, now)?.slot ?? windows[windows.length - 1]?.slot ?? 1;
    const total = Math.round((clock.deadlineAt.getTime() - anchor.getTime()) / DAY_MS);

    return `نوبت ${persianNumber(slot)} از ${persianNumber(5)} · روز ${persianNumber(dayOf(anchor, now, total))} از ${persianNumber(total)}`;
  }

  const total = Math.round(
    (clock.deadlineAt.getTime() - clock.openedAt.getTime() - clock.frozenMs) / DAY_MS,
  ) || AWAITING_FIRST_CALL_DAYS;

  return `روز ${persianNumber(dayOf(clock.openedAt, now, total))} از ${persianNumber(total)}`;
};

export const rebuyWindowProgressOf = (deadlineAt: Date, now: Date): string =>
  `${persianNumber(Math.max(0, Math.ceil((deadlineAt.getTime() - now.getTime()) / HOUR_MS)))} ساعت مانده`;
