import {
  AggregateOperations,
  definePageLayout,
  PageLayoutTabLayoutMode,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  MY_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_VIEW_UNIVERSAL_IDENTIFIER,
  TODAY_FOLLOW_UPS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { PERSON_CALL_URGENCY_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-call-urgency.field';
import { PERSON_LIFECYCLE_STAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-lifecycle-stage.field';
import { PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-owner-member.field';
import { CURRENT_MEMBER_FILTER_VALUE } from 'src/views/follow-up-view.util';

const PERSON = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person;

const countCard = (
  universalIdentifier: string,
  title: string,
  column: number,
  fieldMetadataUniversalIdentifier: string,
  values: string[],
) => ({
  universalIdentifier,
  title,
  type: 'GRAPH' as const,
  objectUniversalIdentifier: PERSON.universalIdentifier,
  position: {
    layoutMode: PageLayoutTabLayoutMode.GRID,
    row: 0,
    column,
    rowSpan: 2,
    columnSpan: 3,
  } as const,
  configuration: {
    configurationType: 'AGGREGATE_CHART' as const,
    aggregateFieldMetadataUniversalIdentifier:
      PERSON.fields.name.universalIdentifier,
    aggregateOperation: AggregateOperations.COUNT,
    displayDataLabel: true,
    timezone: 'Asia/Tehran',
    firstDayOfTheWeek: 6,
    filter: {
      recordFilters: [
        {
          fieldMetadataUniversalIdentifier:
            PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
          operand: 'IS',
          value: JSON.stringify(CURRENT_MEMBER_FILTER_VALUE),
        },
        {
          fieldMetadataUniversalIdentifier,
          operand: 'IS',
          value: JSON.stringify(values),
        },
      ],
    },
  },
});

const followUpTable = (
  universalIdentifier: string,
  title: string,
  row: number,
  viewUniversalIdentifier: string,
) => ({
  universalIdentifier,
  title,
  type: 'RECORD_TABLE' as const,
  objectUniversalIdentifier: PERSON.universalIdentifier,
  position: {
    layoutMode: PageLayoutTabLayoutMode.GRID,
    row,
    column: 0,
    rowSpan: 12,
    columnSpan: 12,
  } as const,
  configuration: {
    configurationType: 'RECORD_TABLE' as const,
    viewUniversalIdentifier,
    isUIEditable: false,
  },
});

export default definePageLayout({
  universalIdentifier: MY_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'My follow-ups',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: 'e6e5bfa5-6eae-4d78-ba35-f690bed23bc6',
      title: 'Today',
      position: 0,
      icon: 'IconCalendarEvent',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        countCard('81ff16c4-5a40-4874-a3f7-2ad84e4a2556', 'Overdue', 0, PERSON_CALL_URGENCY_FIELD_UNIVERSAL_IDENTIFIER, ['OVERDUE']),
        countCard('900b63db-14ff-4b02-bf25-8db15c7a7bac', 'Due', 3, PERSON_CALL_URGENCY_FIELD_UNIVERSAL_IDENTIFIER, ['DUE']),
        countCard('6ea1077a-9718-4030-9d18-7f7ed035170d', 'Rest of today', 6, PERSON_CALL_URGENCY_FIELD_UNIVERSAL_IDENTIFIER, ['TODAY']),
        countCard('4260a68a-65e3-4069-8128-9bbde907ac01', 'Awaiting first call', 9, PERSON_LIFECYCLE_STAGE_FIELD_UNIVERSAL_IDENTIFIER, ['AWAITING_FIRST_CALL']),
        followUpTable('bcaa805d-a757-4d1e-8d3b-36f41beed6ca', 'Today', 2, TODAY_FOLLOW_UPS_VIEW_UNIVERSAL_IDENTIFIER),
      ],
    },
    {
      universalIdentifier: 'd15f9ba2-4c41-44f1-a527-9f515a67dce5',
      title: 'All',
      position: 1,
      icon: 'IconList',
      layoutMode: PageLayoutTabLayoutMode.GRID,
      widgets: [
        followUpTable('aa57b9bc-e48a-40ab-813c-84b612379d11', 'All', 0, MY_FOLLOW_UPS_VIEW_UNIVERSAL_IDENTIFIER),
      ],
    },
  ],
});
