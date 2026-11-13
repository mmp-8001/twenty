import {
  definePageLayoutTab,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { CONTACT_OVERVIEW_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Between Home (10) and Timeline (20) so it opens as the first content tab.
export default definePageLayoutTab({
  universalIdentifier: 'b530278b-c8d1-4be5-85ff-bce65cab6850',
  pageLayoutUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.personRecordPage.universalIdentifier,
  title: 'Overview',
  position: 15,
  icon: 'IconLayoutDashboard',
  layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
  widgets: [
    {
      universalIdentifier: '24dbe4c1-c603-4cbe-bd43-9bb98f0ce2c7',
      title: 'Overview',
      type: 'FRONT_COMPONENT',
      heightBehavior: 'TAB_VIEWPORT',
      configuration: {
        configurationType: 'FRONT_COMPONENT',
        frontComponentUniversalIdentifier: CONTACT_OVERVIEW_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
      },
    },
  ],
});
