import { definePageLayout, PageLayoutTabLayoutMode, PageLayoutType } from 'twenty-sdk/define';

import {
  REPORTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  REPORTS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  REPORTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  REPORTS_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: REPORTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Reports',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: REPORTS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Reports',
      position: 0,
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: REPORTS_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Reports',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: REPORTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
