import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import {
  TODAY_FOLLOW_UPS_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  TODAY_FOLLOW_UPS_NEXT_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  TODAY_FOLLOW_UPS_NEXT_CALL_SORT_UNIVERSAL_IDENTIFIER,
  TODAY_FOLLOW_UPS_OWNER_FILTER_UNIVERSAL_IDENTIFIER,
  TODAY_FOLLOW_UPS_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER,
  TODAY_FOLLOW_UPS_URGENCY_FIELD_UNIVERSAL_IDENTIFIER,
  TODAY_FOLLOW_UPS_URGENCY_FILTER_UNIVERSAL_IDENTIFIER,
  TODAY_FOLLOW_UPS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { PERSON_CALL_URGENCY_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-call-urgency.field';
import { PERSON_NEXT_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-next-call-at.field';
import { PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-owner-member.field';
import {
  CURRENT_MEMBER_FILTER_VALUE,
  followUpColumns,
} from 'src/views/follow-up-view.util';

// The "Today" tab of My follow-ups: calls due later today, due now, or overdue.
export default defineView({
  universalIdentifier: TODAY_FOLLOW_UPS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Today',
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: ViewType.TABLE,
  icon: 'IconCalendarEvent',
  position: 2,
  fields: followUpColumns([
    TODAY_FOLLOW_UPS_NAME_FIELD_UNIVERSAL_IDENTIFIER,
    TODAY_FOLLOW_UPS_NEXT_CALL_FIELD_UNIVERSAL_IDENTIFIER,
    TODAY_FOLLOW_UPS_URGENCY_FIELD_UNIVERSAL_IDENTIFIER,
    TODAY_FOLLOW_UPS_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER,
  ]),
  filters: [
    {
      universalIdentifier: TODAY_FOLLOW_UPS_OWNER_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: CURRENT_MEMBER_FILTER_VALUE,
    },
    {
      universalIdentifier: TODAY_FOLLOW_UPS_URGENCY_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_CALL_URGENCY_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['TODAY', 'DUE', 'OVERDUE'],
    },
  ],
  sorts: [
    {
      universalIdentifier: TODAY_FOLLOW_UPS_NEXT_CALL_SORT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_NEXT_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER,
      direction: ViewSortDirection.ASC,
    },
  ],
});
