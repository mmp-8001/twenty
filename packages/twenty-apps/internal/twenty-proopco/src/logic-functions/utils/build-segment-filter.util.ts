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
}: {
  operand: string;
  type: string;
  value: unknown;
  isMicros: boolean;
}): { condition: RecordFilter; negate: boolean } | undefined => {
  const amount = () => (isMicros ? Number(value) * MICROS_PER_UNIT : Number(value));
  const isNumeric = type === 'NUMBER' || isMicros;
  const isDate = type === 'DATE' || type === 'DATE_TIME';

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
    default:
      return undefined;
  }
};

const buildLeaf = (
  filter: SegmentFilter,
  field: SegmentField | undefined,
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
        });

  if (!built) {
    throw new UnsupportedSegmentFilterError(
      `Segment filter operand ${filter.operand} is not supported on ${field.name} (${field.type}${filter.subFieldName ? `.${filter.subFieldName}` : ''})`,
    );
  }

  const target = filter.subFieldName
    ? { [filter.subFieldName]: built.condition }
    : built.condition;
  const leaf = { [field.name]: target };

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
}: {
  filters: SegmentFilter[];
  groups: SegmentFilterGroup[];
  fieldById: Record<string, SegmentField>;
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
    ).map((filter) => buildLeaf(filter, fieldById[filter.fieldMetadataId])),
    ...byPosition(
      groups.filter(({ parentViewFilterGroupId }) => (parentViewFilterGroupId ?? null) === groupId),
    ).map(buildGroup),
  ];

  const members = buildMembers(null);

  return members.length === 0 ? {} : { and: members };
};
