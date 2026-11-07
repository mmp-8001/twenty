const SECOND_MS = 1000;

// What is left of a deadline when the Agent is frozen, never negative.
export const remainingSecondsUntil = (deadlineAt: Date, now: Date): number =>
  Math.max(0, Math.floor((deadlineAt.getTime() - now.getTime()) / SECOND_MS));

export const deadlineAfterRemaining = (remainingSeconds: number, now: Date): Date =>
  new Date(now.getTime() + remainingSeconds * SECOND_MS);

// Unfreeze moves every open call window by the time the Agent was frozen.
export const shiftWindow = ({ windowStartAt, windowEndAt, shiftMs }: {
  windowStartAt: Date;
  windowEndAt: Date;
  shiftMs: number;
}) => ({
  windowStartAt: new Date(windowStartAt.getTime() + shiftMs),
  windowEndAt: new Date(windowEndAt.getTime() + shiftMs),
});

export const daysFrozen = (frozenAt: Date, now: Date): number =>
  Math.max(0, Math.floor((now.getTime() - frozenAt.getTime()) / (24 * 60 * 60 * SECOND_MS)));
