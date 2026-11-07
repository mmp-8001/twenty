const readNumber = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);

  return process.env[name] && Number.isFinite(value) && value >= 0 ? value : fallback;
};

// Application variables arrive as environment variables; the defaults are the global values (RB-04).
export const readRebuySettings = () => ({
  startHours: readNumber('REBUY_START_HOURS', 72),
  followupDays: readNumber('REBUY_FOLLOWUP_DAYS', 30),
  cooldownDays: readNumber('REBUY_COOLDOWN_DAYS', 30),
});
