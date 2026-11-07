import {
  definePageLayoutWidget,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PERSON_CALL_HISTORY_WIDGET_UNIVERSAL_IDENTIFIER, PERSON_CALL_HISTORY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default definePageLayoutWidget({
  universalIdentifier: PERSON_CALL_HISTORY_WIDGET_UNIVERSAL_IDENTIFIER,
  pageLayoutTabUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.personRecordPage.tabs.home.universalIdentifier,
  title: 'Call history',
  type: 'FRONT_COMPONENT',
  position: { layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST, index: 1002 },
  configuration: {
    configurationType: 'FRONT_COMPONENT',
    frontComponentUniversalIdentifier: PERSON_CALL_HISTORY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  },
});
