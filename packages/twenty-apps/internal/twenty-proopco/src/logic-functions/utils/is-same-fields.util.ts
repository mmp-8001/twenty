import { isArray, isNull, isNumber, isString, isUndefined } from '@sniptt/guards';

import { isPlainObject } from 'src/utils/is-plain-object';

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T/;


// Whether every field we would write already holds that value.
export const isSameValue = (written: unknown, stored: unknown): boolean => {
  if (isNull(written) || isUndefined(written)) {
    return isNull(stored) || isUndefined(stored);
  }

  if (isArray(written)) {
    return (
      isArray(stored) &&
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

  if (isNumber(written)) {
    return Number(stored) === written;
  }

  if (isString(written) && isString(stored)) {
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
