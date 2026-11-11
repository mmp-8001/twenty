import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import {
  MY_REBUY_LIST_DEADLINE_FIELD_UNIVERSAL_IDENTIFIER,
  MY_REBUY_LIST_DEADLINE_SORT_UNIVERSAL_IDENTIFIER,
  MY_REBUY_LIST_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  MY_REBUY_LIST_OWNER_FILTER_UNIVERSAL_IDENTIFIER,
  MY_REBUY_LIST_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER,
  MY_REBUY_LIST_STAGE_FILTER_UNIVERSAL_IDENTIFIER,
  MY_REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { PERSON_DEADLINE_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-deadline-at.field';
import { PERSON_LIFECYCLE_STAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-lifecycle-stage.field';
import { PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-owner-member.field';
import { PERSON_PLAN_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-plan-progress.field';
import { CURRENT_MEMBER_FILTER_VALUE } from 'src/views/follow-up-view.util';

const { person } = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS;

export default defineView({
  universalIdentifier: MY_REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'My rebuy list',
  objectUniversalIdentifier: person.universalIdentifier,
  type: ViewType.TABLE,
  icon: 'IconRepeat',
  position: 3,
  fields: [
    [MY_REBUY_LIST_NAME_FIELD_UNIVERSAL_IDENTIFIER, person.fields.name.universalIdentifier, 220],
    [MY_REBUY_LIST_DEADLINE_FIELD_UNIVERSAL_IDENTIFIER, PERSON_DEADLINE_AT_FIELD_UNIVERSAL_IDENTIFIER, 180],
    [MY_REBUY_LIST_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER, PERSON_PLAN_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER, 160],
  ].map(([universalIdentifier, fieldMetadataUniversalIdentifier, size], position) => ({
    universalIdentifier: universalIdentifier as string,
    fieldMetadataUniversalIdentifier: fieldMetadataUniversalIdentifier as string,
    position,
    isVisible: true,
    size: size as number,
  })),
  filters: [
    {
      universalIdentifier: MY_REBUY_LIST_OWNER_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_OWNER_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: CURRENT_MEMBER_FILTER_VALUE,
    },
    {
      universalIdentifier: MY_REBUY_LIST_STAGE_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_LIFECYCLE_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['REBUY_WINDOW'],
    },
  ],
  sorts: [
    {
      universalIdentifier: MY_REBUY_LIST_DEADLINE_SORT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: PERSON_DEADLINE_AT_FIELD_UNIVERSAL_IDENTIFIER,
      direction: ViewSortDirection.ASC,
    },
  ],
});
