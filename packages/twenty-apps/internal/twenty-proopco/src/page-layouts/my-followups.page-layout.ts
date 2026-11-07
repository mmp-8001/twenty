import { definePageLayout, PageLayoutTabLayoutMode, PageLayoutType } from 'twenty-sdk/define';

import {
  MY_FOLLOWUPS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  MY_FOLLOWUPS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  MY_FOLLOWUPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  MY_FOLLOWUPS_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: MY_FOLLOWUPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'My follow-ups',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: MY_FOLLOWUPS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'My follow-ups',
      position: 0,
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: MY_FOLLOWUPS_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'My follow-ups',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: MY_FOLLOWUPS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
