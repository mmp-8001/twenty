import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import {
  buildSegmentFilter,
  type SegmentField,
  type SegmentFilter,
  type SegmentFilterGroup,
} from 'src/logic-functions/utils/build-segment-filter.util';

export const readSegmentFilter = async (
  viewId: string,
  now: Date = new Date(),
): Promise<Record<string, unknown>> => {
  const metadata = new MetadataApiClient();
  const { getViewFilters, getViewFilterGroups } = (await metadata.query({
    getViewFilters: {
      __args: { viewId },
      id: true,
      fieldMetadataId: true,
      operand: true,
      value: true,
      subFieldName: true,
      viewFilterGroupId: true,
      positionInViewFilterGroup: true,
    },
    getViewFilterGroups: {
      __args: { viewId },
      id: true,
      parentViewFilterGroupId: true,
      logicalOperator: true,
      positionInViewFilterGroup: true,
    },
  } as never)) as unknown as {
    getViewFilters: SegmentFilter[];
    getViewFilterGroups: SegmentFilterGroup[];
  };
  const fieldById: Record<string, SegmentField> = {};

  for (const fieldMetadataId of new Set(
    getViewFilters.map((filter) => filter.fieldMetadataId),
  )) {
    const { field } = (await metadata.query({
      field: { __args: { id: fieldMetadataId }, name: true, type: true },
    } as never)) as unknown as { field: SegmentField };

    fieldById[fieldMetadataId] = field;
  }

  return buildSegmentFilter({
    filters: getViewFilters,
    groups: getViewFilterGroups,
    fieldById,
    now,
  });
};
