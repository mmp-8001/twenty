import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';

import {
  MY_FOLLOWUPS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  MY_FOLLOWUPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: MY_FOLLOWUPS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  name: 'My follow-ups',
  icon: 'IconPhoneCheck',
  position: 103,
  pageLayoutUniversalIdentifier: MY_FOLLOWUPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
