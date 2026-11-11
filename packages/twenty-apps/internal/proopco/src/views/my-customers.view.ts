import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import {
  MY_CUSTOMERS_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  MY_CUSTOMERS_NAME_SORT_UNIVERSAL_IDENTIFIER,
  MY_CUSTOMERS_NEXT_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  MY_CUSTOMERS_OWNER_FILTER_UNIVERSAL_IDENTIFIER,
  MY_CUSTOMERS_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER,
  MY_CUSTOMERS_STAGE_FILTER_UNIVERSAL_IDENTIFIER,
  MY_CUSTOMERS_URGENCY_FIELD_UNIVERSAL_IDENTIFIER,
  MY_CUSTOMERS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { PERSON_LIFECYCLE_STAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-lifecycle-stage.field';
import { PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-owner-member.field';
import {
  CURRENT_MEMBER_FILTER_VALUE,
  followUpColumns,
} from 'src/views/follow-up-view.util';

const { person } = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS;

export default defineView({
  universalIdentifier: MY_CUSTOMERS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'My customers',
  objectUniversalIdentifier: person.universalIdentifier,
  type: ViewType.TABLE,
  icon: 'IconUsers',
  position: 4,
  fields: followUpColumns([
    MY_CUSTOMERS_NAME_FIELD_UNIVERSAL_IDENTIFIER,
    MY_CUSTOMERS_NEXT_CALL_FIELD_UNIVERSAL_IDENTIFIER,
    MY_CUSTOMERS_URGENCY_FIELD_UNIVERSAL_IDENTIFIER,
    MY_CUSTOMERS_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER,
  ]),
  filters: [
    {
      universalIdentifier: MY_CUSTOMERS_OWNER_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: CURRENT_MEMBER_FILTER_VALUE,
    },
    {
      universalIdentifier: MY_CUSTOMERS_STAGE_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_LIFECYCLE_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['CUSTOMER'],
    },
  ],
  sorts: [
    {
      universalIdentifier: MY_CUSTOMERS_NAME_SORT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: person.fields.name.universalIdentifier,
      direction: ViewSortDirection.ASC,
    },
  ],
});
