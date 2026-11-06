import {
  resolveRelativeDateRange,
  toTehranPlainDate,
} from 'src/logic-functions/utils/resolve-relative-date-range.util';

export type SegmentFilter = {
  id: string;
  fieldMetadataId: string;
  operand: string;
  value: unknown;
  subFieldName?: string | null;
  viewFilterGroupId?: string | null;
  positionInViewFilterGroup?: number | null;
};

export type SegmentFilterGroup = {
  id: string;
  parentViewFilterGroupId?: string | null;
  logicalOperator: 'AND' | 'OR' | 'NOT';
  positionInViewFilterGroup?: number | null;
};

export type SegmentField = { name: string; type: string };

type RecordFilter = Record<string, unknown>;

export class UnsupportedSegmentFilterError extends Error {}

const MICROS_PER_UNIT = 1_000_000;

const parseSelectValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === 'string' && value.startsWith('[')) {
    try {
      return (JSON.parse(value) as unknown[]).map(String);
    } catch {
      // Falls through: a bare value that merely starts with a bracket.
    }
  }

  return [String(value)];
};

// Condition on the field itself; negated operands are wrapped by the caller.
const buildCondition = ({
  operand,
  type,
  value,
  isMicros,
  now,
}: {
  operand: string;
  type: string;
  value: unknown;
  isMicros: boolean;
  now: Date;
}): { condition: RecordFilter; also?: RecordFilter; negate: boolean } | undefined => {
  const amount = () => (isMicros ? Number(value) * MICROS_PER_UNIT : Number(value));
  const isNumeric = type === 'NUMBER' || isMicros;
  const isDate = type === 'DATE' || type === 'DATE_TIME';
  const formatDate = (instant: Date) =>
    type === 'DATE' ? toTehranPlainDate(instant) : instant.toISOString();
  // A field takes one operator per filter, so a range is two conditions.
  const range = (start: Date, end: Date) => ({
    condition: { gte: formatDate(start) },
    also: { lt: formatDate(end) },
    negate: false,
  });

  switch (operand) {
    case 'IS_EMPTY':
      return type === 'TEXT'
        ? { condition: { or: [{ is: 'NULL' }, { eq: '' }] }, negate: false }
        : { condition: { is: 'NULL' }, negate: false };
    case 'IS_NOT_EMPTY':
    case 'IS_NOT_NULL':
      return { condition: { is: 'NOT_NULL' }, negate: false };
    case 'IS':
      if (isNumeric) return { condition: { eq: amount() }, negate: false };
      if (type === 'BOOLEAN') return { condition: { eq: String(value) === 'true' }, negate: false };
      if (type === 'SELECT') return { condition: { in: parseSelectValues(value) }, negate: false };
      if (type === 'DATE') return { condition: { eq: String(value) }, negate: false };
      return undefined;
    case 'IS_NOT':
      if (isNumeric) return { condition: { neq: amount() }, negate: false };
      if (type === 'SELECT') return { condition: { in: parseSelectValues(value) }, negate: true };
      return undefined;
    case 'CONTAINS':
      return type === 'TEXT'
        ? { condition: { ilike: `%${String(value)}%` }, negate: false }
        : undefined;
    case 'DOES_NOT_CONTAIN':
      return type === 'TEXT'
        ? { condition: { ilike: `%${String(value)}%` }, negate: true }
        : undefined;
    case 'GREATER_THAN_OR_EQUAL':
      return isNumeric ? { condition: { gte: amount() }, negate: false } : undefined;
    case 'LESS_THAN_OR_EQUAL':
      return isNumeric ? { condition: { lte: amount() }, negate: false } : undefined;
    // IS_AFTER includes the boundary, as the Views UI does.
    case 'IS_AFTER':
      return isDate ? { condition: { gte: String(value) }, negate: false } : undefined;
    case 'IS_BEFORE':
      return isDate ? { condition: { lt: String(value) }, negate: false } : undefined;
    case 'IS_RELATIVE': {
      const resolved = isDate
        ? resolveRelativeDateRange(String(value), now)
        : undefined;

      return resolved ? range(resolved.start, resolved.end) : undefined;
    }
    case 'IS_TODAY': {
      const resolved = isDate ? resolveRelativeDateRange('THIS_1_DAY', now) : undefined;

      return resolved ? range(resolved.start, resolved.end) : undefined;
    }
    case 'IS_IN_PAST':
      return isDate
        ? { condition: { lt: formatDate(now) }, negate: false }
        : undefined;
    case 'IS_IN_FUTURE':
      return isDate
        ? {
            condition:
              type === 'DATE'
                ? { gte: formatDate(now) }
                : { gt: formatDate(now) },
            negate: false,
          }
        : undefined;
    default:
      return undefined;
  }
};

const buildLeaf = (
  filter: SegmentFilter,
  field: SegmentField | undefined,
  now: Date,
): RecordFilter => {
  if (!field) {
    throw new UnsupportedSegmentFilterError(
      `Segment filter ${filter.id} points at an unknown field`,
    );
  }

  const isMicros = field.type === 'CURRENCY' && filter.subFieldName === 'amountMicros';
  const built =
    field.type === 'CURRENCY' && !isMicros
      ? undefined
      : buildCondition({
          operand: filter.operand,
          type: isMicros ? 'NUMBER' : field.type,
          value: filter.value,
          isMicros,
          now,
        });

  if (!built) {
    throw new UnsupportedSegmentFilterError(
      `Segment filter operand ${filter.operand} is not supported on ${field.name} (${field.type}${filter.subFieldName ? `.${filter.subFieldName}` : ''})`,
    );
  }

  const target = filter.subFieldName
    ? { [filter.subFieldName]: built.condition }
    : built.condition;
  const leaf = built.also
    ? { and: [{ [field.name]: target }, { [field.name]: built.also }] }
    : { [field.name]: target };

  return built.negate ? { not: leaf } : leaf;
};

const byPosition = <TItem extends { positionInViewFilterGroup?: number | null }>(
  items: TItem[],
) =>
  [...items].sort(
    (left, right) =>
      (left.positionInViewFilterGroup ?? 0) -
      (right.positionInViewFilterGroup ?? 0),
  );

export const buildSegmentFilter = ({
  filters,
  groups,
  fieldById,
  now = new Date(),
}: {
  filters: SegmentFilter[];
  groups: SegmentFilterGroup[];
  fieldById: Record<string, SegmentField>;
  now?: Date;
}): RecordFilter => {
  const buildGroup = (group: SegmentFilterGroup): RecordFilter => {
    const members = buildMembers(group.id);

    if (group.logicalOperator === 'OR') return { or: members };
    if (group.logicalOperator === 'NOT') return { not: { and: members } };

    return { and: members };
  };

  const buildMembers = (groupId: string | null): RecordFilter[] => [
    ...byPosition(
      filters.filter(({ viewFilterGroupId }) => (viewFilterGroupId ?? null) === groupId),
    ).map((filter) => buildLeaf(filter, fieldById[filter.fieldMetadataId], now)),
    ...byPosition(
      groups.filter(({ parentViewFilterGroupId }) => (parentViewFilterGroupId ?? null) === groupId),
    ).map(buildGroup),
  ];

  const members = buildMembers(null);

  return members.length === 0 ? {} : { and: members };
};
