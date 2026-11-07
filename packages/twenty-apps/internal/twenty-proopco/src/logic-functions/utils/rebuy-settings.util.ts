const readNumberEnv = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);

  return process.env[name] && Number.isFinite(value) && value >= 0 ? value : fallback;
};

// Application variables arrive as environment variables; the defaults are the global values.
export const readRebuySettings = () => ({
  startHours: readNumberEnv('REBUY_START_HOURS', 72),
  followupDays: readNumberEnv('REBUY_FOLLOWUP_DAYS', 30),
  cooldownDays: readNumberEnv('REBUY_COOLDOWN_DAYS', 30),
});
