import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import {
  REPORT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  REPORT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// One widget in a vertical-list tab renders full page, without a card frame.
export default definePageLayout({
  universalIdentifier: REPORT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Report',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: '6f0727a3-0898-4ce8-a81f-d6c1a3c68df2',
      title: 'Report',
      position: 0,
      icon: 'IconLayoutDashboard',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '4a64bea9-624a-4df4-9c5a-29b7af14a83f',
          title: 'Report',
          type: 'FRONT_COMPONENT',
          heightBehavior: 'TAB_VIEWPORT',
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier: REPORT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
