import { defineView, ViewType } from 'twenty-sdk/define';

import {
  AGENTS_VIEW_UNIVERSAL_IDENTIFIER,
  AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  AGENTS_VIEW_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  AGENTS_VIEW_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
  AGENTS_VIEW_FROZEN_FIELD_UNIVERSAL_IDENTIFIER,
  AGENTS_VIEW_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
  AGENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  AGENT_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
  AGENT_FROZEN_SINCE_FIELD_UNIVERSAL_IDENTIFIER,
  AGENT_OWNED_CONTACT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const column = (
  universalIdentifier: string,
  fieldMetadataUniversalIdentifier: string,
  position: number,
) => ({
  universalIdentifier,
  fieldMetadataUniversalIdentifier,
  position,
  isVisible: true,
  size: 180,
});

export default defineView({
  universalIdentifier: AGENTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Agents',
  objectUniversalIdentifier: AGENT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconHeadset',
  position: 4,
  fields: [
    column(
      AGENTS_VIEW_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      AGENT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      0,
    ),
    column(
      AGENTS_VIEW_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
      AGENT_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
      1,
    ),
    column(
      AGENTS_VIEW_FROZEN_FIELD_UNIVERSAL_IDENTIFIER,
      AGENT_FROZEN_SINCE_FIELD_UNIVERSAL_IDENTIFIER,
      2,
    ),
    column(
      AGENTS_VIEW_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      AGENT_OWNED_CONTACT_COUNT_FIELD_UNIVERSAL_IDENTIFIER,
      3,
    ),
  ],
});
