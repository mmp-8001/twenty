import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import {
  MY_HISTORY_VIEW_CLOSE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_VIEW_MEMBER_FILTER_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_VIEW_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_VIEW_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_VIEW_SORT_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_VIEW_STAGE_FILTER_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_VIEW_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { OPPORTUNITY_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-agent-member.field';
import { OPPORTUNITY_CLOSE_REASON_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-close-reason.field';
import { OPPORTUNITY_DEAL_STAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-deal-stage.field';
import { OPPORTUNITY_DEAL_TYPE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/opportunity-deal-type.field';
import { CURRENT_MEMBER_FILTER_VALUE } from 'src/views/follow-up-view.util';

const { opportunity } = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS;

const column = (universalIdentifier: string, fieldMetadataUniversalIdentifier: string, position: number) => ({
  universalIdentifier,
  fieldMetadataUniversalIdentifier,
  position,
  isVisible: true,
  size: 180,
});

export default defineView({
  universalIdentifier: MY_HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'My history',
  objectUniversalIdentifier: opportunity.universalIdentifier,
  type: ViewType.TABLE,
  icon: 'IconHistory',
  position: 5,
  fields: [
    column(MY_HISTORY_VIEW_NAME_FIELD_UNIVERSAL_IDENTIFIER, opportunity.fields.name.universalIdentifier, 0),
    column(MY_HISTORY_VIEW_CLOSE_DATE_FIELD_UNIVERSAL_IDENTIFIER, opportunity.fields.closeDate.universalIdentifier, 1),
    column(MY_HISTORY_VIEW_REASON_FIELD_UNIVERSAL_IDENTIFIER, OPPORTUNITY_CLOSE_REASON_FIELD_UNIVERSAL_IDENTIFIER, 2),
    column(MY_HISTORY_VIEW_TYPE_FIELD_UNIVERSAL_IDENTIFIER, OPPORTUNITY_DEAL_TYPE_FIELD_UNIVERSAL_IDENTIFIER, 3),
  ],
  filters: [
    {
      universalIdentifier: MY_HISTORY_VIEW_MEMBER_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: OPPORTUNITY_AGENT_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: CURRENT_MEMBER_FILTER_VALUE,
    },
    {
      universalIdentifier: MY_HISTORY_VIEW_STAGE_FILTER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: OPPORTUNITY_DEAL_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['WON', 'LOST', 'VOID'],
    },
  ],
  sorts: [
    {
      universalIdentifier: MY_HISTORY_VIEW_SORT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: opportunity.fields.closeDate.universalIdentifier,
      direction: ViewSortDirection.DESC,
    },
  ],
});
