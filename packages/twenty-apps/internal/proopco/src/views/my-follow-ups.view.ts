import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import {
  MY_FOLLOW_UPS_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_NEXT_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_NEXT_CALL_SORT_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_OWNER_FILTER_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_STAGE_FILTER_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_URGENCY_FIELD_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { PERSON_LIFECYCLE_STAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-lifecycle-stage.field';
import { PERSON_NEXT_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-next-call-at.field';
import { PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-owner-member.field';
import {
  CURRENT_MEMBER_FILTER_VALUE,
  followUpColumns,
} from 'src/views/follow-up-view.util';

// Customers with a next call join in #93 with the other record lists.
export default defineView({
  universalIdentifier: MY_FOLLOW_UPS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'My follow-ups',
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: ViewType.TABLE,
  icon: 'IconPhoneCall',
  position: 1,
  fields: followUpColumns([
    MY_FOLLOW_UPS_NAME_FIELD_UNIVERSAL_IDENTIFIER,
    MY_FOLLOW_UPS_NEXT_CALL_FIELD_UNIVERSAL_IDENTIFIER,
    MY_FOLLOW_UPS_URGENCY_FIELD_UNIVERSAL_IDENTIFIER,
    MY_FOLLOW_UPS_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER,
  ]),
  filters: [
    {
      universalIdentifier: MY_FOLLOW_UPS_OWNER_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: CURRENT_MEMBER_FILTER_VALUE,
    },
    {
      universalIdentifier: MY_FOLLOW_UPS_STAGE_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_LIFECYCLE_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['AWAITING_FIRST_CALL', 'IN_FOLLOW_UP'],
    },
  ],
  sorts: [
    {
      universalIdentifier: MY_FOLLOW_UPS_NEXT_CALL_SORT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_NEXT_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER,
      direction: ViewSortDirection.ASC,
    },
  ],
});
