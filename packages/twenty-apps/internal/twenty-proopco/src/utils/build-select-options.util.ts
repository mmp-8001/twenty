import { createHash } from 'crypto';

// Option ids come from the field name and value, so they stay stable across installs.
export const buildSelectOptions = (fieldKey: string, values: readonly string[]) =>
  values.map((value, position) => {
    const hash = createHash('sha1').update(`${fieldKey}:${value}`).digest('hex');

    return {
      id: `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`,
      value,
      label: value
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/^./, (character) => character.toUpperCase()),
      position,
      color: 'gray' as const,
    };
  });
