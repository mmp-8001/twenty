import { describe, expect, it } from 'vitest';

import {
  buildSegmentRule,
  type SegmentField,
} from 'src/logic-functions/utils/segment-filter.util';

const fields: SegmentField[] = [
  { id: 'f-country', name: 'country', type: 'TEXT', label: 'Country' },
  { id: 'f-count', name: 'purchaseCount', type: 'NUMBER', label: 'Purchase count' },
  { id: 'f-signup', name: 'signupAt', type: 'DATE_TIME', label: 'Signup at' },
  { id: 'f-owner', name: 'ownerMember', type: 'RELATION', label: 'Owner member' },
  { id: 'f-name', name: 'name', type: 'FULL_NAME', label: 'Name' },
];

describe('buildSegmentRule', () => {
  it('converts flat filters on segment attributes', () => {
    const rule = buildSegmentRule({
      filters: [
        { fieldMetadataId: 'f-country', operand: 'IS', value: 'IR' },
        { fieldMetadataId: 'f-count', operand: 'GREATER_THAN_OR_EQUAL', value: '2' },
      ],
      groups: [],
      fields,
    });

    expect(rule).toEqual({
      isValid: true,
      filter: expect.objectContaining({ and: expect.any(Array) }),
    });
  });

  it('resolves relative dates in Tehran time', () => {
    const rule = buildSegmentRule({
      filters: [
        {
          fieldMetadataId: 'f-signup',
          operand: 'IS_RELATIVE',
          value: 'PAST_7_DAY',
        },
      ],
      groups: [],
      fields,
    });

    expect(rule.isValid).toBe(true);
  });

  it('rejects a segment with no filters', () => {
    expect(buildSegmentRule({ filters: [], groups: [], fields })).toEqual({
      isValid: false,
      error: 'A segment needs at least one filter',
    });
  });

  it('rejects fields that are not segment attributes', () => {
    expect(
      buildSegmentRule({
        filters: [{ fieldMetadataId: 'f-name', operand: 'CONTAINS', value: 'a' }],
        groups: [],
        fields,
      }),
    ).toEqual({ isValid: false, error: 'Name cannot be used in a segment' });
  });

  it('rejects a Me filter', () => {
    const result = buildSegmentRule({
      filters: [
        {
          fieldMetadataId: 'f-country',
          operand: 'IS',
          value: JSON.stringify({ isCurrentWorkspaceMemberSelected: true }),
        },
      ],
      groups: [],
      fields,
    });

    expect(result).toEqual({
      isValid: false,
      error: '"Me" filters cannot be used in a segment',
    });
  });

  it('rejects nested groups', () => {
    const result = buildSegmentRule({
      filters: [{ fieldMetadataId: 'f-country', operand: 'IS', value: 'IR' }],
      groups: [
        { id: 'g1', logicalOperator: 'AND' },
        { id: 'g2', parentViewFilterGroupId: 'g1', logicalOperator: 'OR' },
      ],
      fields,
    });

    expect(result.isValid).toBe(false);
  });
});
