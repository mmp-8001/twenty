const WINDOW_MS = 60_000;
const SETTLE_MS = 5_000;

// Every change in the same minute shares one job id, so a burst of edits runs one full pass after the minute ends.
export const eligibilityRefreshJobOf = (now: Date) => {
  const windowEnd = (Math.floor(now.getTime() / WINDOW_MS) + 1) * WINDOW_MS;

  return {
    jobId: `proopco-eligibility-${windowEnd}`,
    delayMs: windowEnd - now.getTime() + SETTLE_MS,
  };
};
