import { type MetadataApiClient } from 'twenty-client-sdk/metadata';

import {
  buildSegmentRule,
  type SegmentField,
  type SegmentRule,
  type SegmentViewFilter,
  type SegmentViewFilterGroup,
} from 'src/logic-functions/utils/segment-filter.util';

export type MetadataClient = Pick<MetadataApiClient, 'query'>;

// The typed metadata client is generated from the install it ran against, so selections are cast once here.
const queryMetadata = async <TData>(
  metadata: MetadataClient,
  selection: Record<string, unknown>,
) => (await metadata.query(selection as never)) as unknown as TData;

export const readSegmentRule = async (
  metadata: MetadataClient,
  viewId: string,
): Promise<SegmentRule> => {
  const { getViewFilters, getViewFilterGroups } = await queryMetadata<{
    getViewFilters: (SegmentViewFilter & { id: string })[];
    getViewFilterGroups: SegmentViewFilterGroup[];
  }>(metadata, {
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
  });
  const fields: SegmentField[] = [];

  for (const fieldMetadataId of new Set(
    getViewFilters.map((filter) => filter.fieldMetadataId),
  )) {
    const { field } = await queryMetadata<{ field: SegmentField }>(metadata, {
      field: {
        __args: { id: fieldMetadataId },
        id: true,
        name: true,
        type: true,
        label: true,
      },
    });

    fields.push(field);
  }

  return buildSegmentRule({
    filters: getViewFilters,
    groups: getViewFilterGroups,
    fields,
  });
};
