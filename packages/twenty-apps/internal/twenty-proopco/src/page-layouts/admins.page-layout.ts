import { definePageLayout, PageLayoutTabLayoutMode, PageLayoutType } from 'twenty-sdk/define';

import {
  ADMINS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  ADMINS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
  ADMINS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  ADMINS_WIDGET_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default definePageLayout({
  universalIdentifier: ADMINS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Sales Team',
  type: PageLayoutType.STANDALONE_PAGE,
  tabs: [
    {
      universalIdentifier: ADMINS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,
      title: 'Sales Team',
      position: 0,
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: ADMINS_WIDGET_UNIVERSAL_IDENTIFIER,
          title: 'Sales Team',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: ADMINS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
