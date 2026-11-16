import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewFilterGroupLogicalOperator,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import {
  MY_FOLLOW_UPS_CUSTOMER_GROUP_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_CUSTOMER_NEXT_CALL_FILTER_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_CUSTOMER_OWNER_FILTER_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_CUSTOMER_STAGE_FILTER_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_OPEN_GROUP_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_OPEN_OWNER_FILTER_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_ROOT_GROUP_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_NEXT_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_NEXT_CALL_SORT_UNIVERSAL_IDENTIFIER,
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

// Open deals, plus Customers who have a scheduled retention call.
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
  filterGroups: [
    {
      universalIdentifier: MY_FOLLOW_UPS_ROOT_GROUP_UNIVERSAL_IDENTIFIER,
      logicalOperator: ViewFilterGroupLogicalOperator.OR,
    },
    {
      universalIdentifier: MY_FOLLOW_UPS_OPEN_GROUP_UNIVERSAL_IDENTIFIER,
      logicalOperator: ViewFilterGroupLogicalOperator.AND,
      parentViewFilterGroupUniversalIdentifier: MY_FOLLOW_UPS_ROOT_GROUP_UNIVERSAL_IDENTIFIER,
      positionInViewFilterGroup: 0,
    },
    {
      universalIdentifier: MY_FOLLOW_UPS_CUSTOMER_GROUP_UNIVERSAL_IDENTIFIER,
      logicalOperator: ViewFilterGroupLogicalOperator.AND,
      parentViewFilterGroupUniversalIdentifier: MY_FOLLOW_UPS_ROOT_GROUP_UNIVERSAL_IDENTIFIER,
      positionInViewFilterGroup: 1,
    },
  ],
  filters: [
    {
      universalIdentifier: MY_FOLLOW_UPS_OPEN_OWNER_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: CURRENT_MEMBER_FILTER_VALUE,
      viewFilterGroupUniversalIdentifier: MY_FOLLOW_UPS_OPEN_GROUP_UNIVERSAL_IDENTIFIER,
      positionInViewFilterGroup: 0,
    },
    {
      universalIdentifier: MY_FOLLOW_UPS_STAGE_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_LIFECYCLE_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['AWAITING_FIRST_CALL', 'IN_FOLLOW_UP'],
      viewFilterGroupUniversalIdentifier: MY_FOLLOW_UPS_OPEN_GROUP_UNIVERSAL_IDENTIFIER,
      positionInViewFilterGroup: 1,
    },
    {
      universalIdentifier: MY_FOLLOW_UPS_CUSTOMER_OWNER_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: CURRENT_MEMBER_FILTER_VALUE,
      viewFilterGroupUniversalIdentifier: MY_FOLLOW_UPS_CUSTOMER_GROUP_UNIVERSAL_IDENTIFIER,
      positionInViewFilterGroup: 0,
    },
    {
      universalIdentifier: MY_FOLLOW_UPS_CUSTOMER_STAGE_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_LIFECYCLE_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['CUSTOMER'],
      viewFilterGroupUniversalIdentifier: MY_FOLLOW_UPS_CUSTOMER_GROUP_UNIVERSAL_IDENTIFIER,
      positionInViewFilterGroup: 1,
    },
    {
      universalIdentifier: MY_FOLLOW_UPS_CUSTOMER_NEXT_CALL_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_NEXT_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS_NOT_EMPTY,
      value: '',
      viewFilterGroupUniversalIdentifier: MY_FOLLOW_UPS_CUSTOMER_GROUP_UNIVERSAL_IDENTIFIER,
      positionInViewFilterGroup: 2,
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
