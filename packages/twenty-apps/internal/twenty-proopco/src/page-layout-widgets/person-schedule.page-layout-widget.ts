import {
  definePageLayoutWidget,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PERSON_SCHEDULE_WIDGET_UNIVERSAL_IDENTIFIER, PERSON_SCHEDULE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default definePageLayoutWidget({
  universalIdentifier: PERSON_SCHEDULE_WIDGET_UNIVERSAL_IDENTIFIER,
  pageLayoutTabUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.personRecordPage.tabs.home.universalIdentifier,
  title: 'Call schedule',
  type: 'FRONT_COMPONENT',
  position: { layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST, index: 1001 },
  configuration: {
    configurationType: 'FRONT_COMPONENT',
    frontComponentUniversalIdentifier: PERSON_SCHEDULE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  },
});
