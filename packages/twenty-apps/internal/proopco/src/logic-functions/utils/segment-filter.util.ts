import { computeRecordGqlOperationFilter } from 'twenty-shared/utils';

export const SEGMENT_ATTRIBUTE_FIELD_NAMES = [
  'signupAt',
  'hasPhone',
  'country',
  'registrationSource',
  'kycStatus',
  'birthDate',
  'activeAccountCount',
  'purchaseCount',
  'lastPurchaseAt',
  'totalPaidUsdt',
  'currentStage',
  'lastChallengeFailedAt',
  'failedChallengeCount',
  'hasProfitWithdrawal',
  'isReferred',
  'lastLoginAt',
];

export type SegmentViewFilter = {
  fieldMetadataId: string;
  operand: string;
  value: string;
  subFieldName?: string | null;
  viewFilterGroupId?: string | null;
  positionInViewFilterGroup?: number | null;
};

export type SegmentViewFilterGroup = {
  id: string;
  parentViewFilterGroupId?: string | null;
  logicalOperator: string;
  positionInViewFilterGroup?: number | null;
};

export type SegmentField = { id: string; name: string; type: string; label: string };

export type SegmentRule =
  | { isValid: true; filter: Record<string, unknown> }
  | { isValid: false; error: string };

const invalid = (error: string): SegmentRule => ({ isValid: false, error });

export const buildSegmentRule = ({
  filters,
  groups,
  fields,
}: {
  filters: SegmentViewFilter[];
  groups: SegmentViewFilterGroup[];
  fields: SegmentField[];
}): SegmentRule => {
  if (filters.length === 0) {
    return invalid('A segment needs at least one filter');
  }

  if (groups.length > 1 || groups.some((group) => group.parentViewFilterGroupId)) {
    return invalid('Use one flat group of filters');
  }

  const fieldById = new Map(fields.map((field) => [field.id, field]));

  for (const filter of filters) {
    const field = fieldById.get(filter.fieldMetadataId);

    if (!field || !SEGMENT_ATTRIBUTE_FIELD_NAMES.includes(field.name)) {
      return invalid(`${field?.label ?? 'This field'} cannot be used in a segment`);
    }

    if (String(filter.value).includes('isCurrentWorkspaceMemberSelected')) {
      return invalid('"Me" filters cannot be used in a segment');
    }
  }

  try {
    const filter = computeRecordGqlOperationFilter({
      recordFilters: filters.map((viewFilter) => ({
        fieldMetadataId: viewFilter.fieldMetadataId,
        value: viewFilter.value,
        operand: viewFilter.operand,
        subFieldName: viewFilter.subFieldName,
        recordFilterGroupId: viewFilter.viewFilterGroupId,
        positionInRecordFilterGroup: viewFilter.positionInViewFilterGroup,
      })),
      recordFilterGroups: groups.map((group) => ({
        id: group.id,
        parentRecordFilterGroupId: group.parentViewFilterGroupId,
        logicalOperator: group.logicalOperator,
        positionInRecordFilterGroup: group.positionInViewFilterGroup,
      })),
      fieldMetadataItems: fields,
      filterValueDependencies: { timeZone: 'Asia/Tehran' },
    });

    // An unreadable condition converts to nothing, and nothing would match everyone.
    return Object.keys(filter).length === 0
      ? invalid('The filters could not be read')
      : { isValid: true, filter };
  } catch (error) {
    return invalid(error instanceof Error ? error.message : 'The filters could not be read');
  }
};
