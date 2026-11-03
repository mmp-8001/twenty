const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

export const normalizePhone = (raw: string): string | undefined => {
  const phone = raw.replace(/[\s\-().]/g, '');

  return E164_PATTERN.test(phone) ? phone : undefined;
};
