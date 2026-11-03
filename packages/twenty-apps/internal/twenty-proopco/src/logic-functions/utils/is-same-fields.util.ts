const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T/;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Whether every field we would write already holds that value.
export const isSameValue = (written: unknown, stored: unknown): boolean => {
  if (written === null || written === undefined) {
    return stored === null || stored === undefined;
  }

  if (Array.isArray(written)) {
    return (
      Array.isArray(stored) &&
      written.length === stored.length &&
      written.every((item, index) => isSameValue(item, stored[index]))
    );
  }

  if (isPlainObject(written)) {
    return (
      isPlainObject(stored) &&
      Object.entries(written).every(([key, value]) =>
        isSameValue(value, stored[key]),
      )
    );
  }

  if (typeof written === 'number') {
    return Number(stored) === written;
  }

  if (typeof written === 'string' && typeof stored === 'string') {
    return (
      written === stored ||
      (ISO_DATE_TIME.test(written) &&
        new Date(written).getTime() === new Date(stored).getTime())
    );
  }

  return written === stored;
};

export const buildSelection = (
  fields: Record<string, unknown>,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      isPlainObject(value) ? buildSelection(value) : true,
    ]),
  );
