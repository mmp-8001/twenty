import { describe, expect, it } from 'vitest';

import {
  buildSegmentFilter,
  type SegmentFilter,
  UnsupportedSegmentFilterError,
} from 'src/logic-functions/utils/build-segment-filter.util';

const fieldById = {
  vip: { name: 'isVip', type: 'BOOLEAN' },
  source: { name: 'source', type: 'TEXT' },
  count: { name: 'purchaseCount', type: 'NUMBER' },
  spent: { name: 'totalSpent', type: 'CURRENCY' },
  last: { name: 'lastPurchaseAt', type: 'DATE_TIME' },
  kind: { name: 'kind', type: 'SELECT' },
  labels: { name: 'labels', type: 'ARRAY' },
};

const filter = (overrides: Partial<SegmentFilter>): SegmentFilter => ({
  id: 'f',
  fieldMetadataId: 'vip',
  operand: 'IS',
  value: 'true',
  ...overrides,
});

const build = (filters: SegmentFilter[], groups = []) =>
  buildSegmentFilter({ filters, groups, fieldById });

describe('buildSegmentFilter', () => {
  it('returns an empty filter for a View without filters', () => {
    expect(build([])).toEqual({});
  });

  it.each([
    [filter({}), { isVip: { eq: true } }],
    [filter({ fieldMetadataId: 'source', operand: 'IS_EMPTY' }), { source: { or: [{ is: 'NULL' }, { eq: '' }] } }],
    [filter({ fieldMetadataId: 'count', value: '3' }), { purchaseCount: { eq: 3 } }],
    [filter({ fieldMetadataId: 'source', operand: 'CONTAINS', value: 'ad' }), { source: { ilike: '%ad%' } }],
    [filter({ fieldMetadataId: 'source', operand: 'DOES_NOT_CONTAIN', value: 'ad' }), { not: { source: { ilike: '%ad%' } } }],
    [filter({ fieldMetadataId: 'count', operand: 'GREATER_THAN_OR_EQUAL', value: '3' }), { purchaseCount: { gte: 3 } }],
    [filter({ fieldMetadataId: 'count', operand: 'LESS_THAN_OR_EQUAL', value: '3' }), { purchaseCount: { lte: 3 } }],
    [filter({ fieldMetadataId: 'spent', subFieldName: 'amountMicros', operand: 'GREATER_THAN_OR_EQUAL', value: '100' }), { totalSpent: { amountMicros: { gte: 100_000_000 } } }],
    [filter({ fieldMetadataId: 'last', operand: 'IS_AFTER', value: '2026-01-01' }), { lastPurchaseAt: { gte: '2026-01-01' } }],
    [filter({ fieldMetadataId: 'last', operand: 'IS_BEFORE', value: '2026-01-01' }), { lastPurchaseAt: { lt: '2026-01-01' } }],
    [filter({ fieldMetadataId: 'last', operand: 'IS_EMPTY' }), { lastPurchaseAt: { is: 'NULL' } }],
    [filter({ fieldMetadataId: 'last', operand: 'IS_NOT_EMPTY' }), { lastPurchaseAt: { is: 'NOT_NULL' } }],
    [filter({ fieldMetadataId: 'kind', value: '["A","B"]' }), { kind: { in: ['A', 'B'] } }],
    [filter({ fieldMetadataId: 'kind', operand: 'IS_NOT', value: 'A' }), { not: { kind: { in: ['A'] } } }],
  ])('maps %j', (segmentFilter, expected) => {
    expect(build([segmentFilter])).toEqual({ and: [expected] });
  });

  it('nests filter groups with their logical operator', () => {
    const result = buildSegmentFilter({
      filters: [
        filter({ id: 'a' }),
        filter({ id: 'b', fieldMetadataId: 'source', operand: 'CONTAINS', value: 'ads', viewFilterGroupId: 'g' }),
        filter({ id: 'c', fieldMetadataId: 'source', operand: 'CONTAINS', value: 'seo', viewFilterGroupId: 'g' }),
      ],
      groups: [{ id: 'g', logicalOperator: 'OR' }],
      fieldById,
    });

    expect(result).toEqual({
      and: [
        { isVip: { eq: true } },
        { or: [{ source: { ilike: '%ads%' } }, { source: { ilike: '%seo%' } }] },
      ],
    });
  });

  it.each([
    [filter({ operand: 'IS_RELATIVE' }), 'IS_RELATIVE'],
    [filter({ fieldMetadataId: 'labels', operand: 'CONTAINS' }), 'labels'],
    [filter({ fieldMetadataId: 'count', operand: 'CONTAINS' }), 'purchaseCount'],
    [filter({ fieldMetadataId: 'nope' }), 'unknown field'],
  ])('rejects %j naming %s', (segmentFilter, expectedText) => {
    expect(() => build([segmentFilter])).toThrow(UnsupportedSegmentFilterError);
    expect(() => build([segmentFilter])).toThrow(expectedText);
  });
});
