import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';

import {
  REPORTS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  REPORTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: REPORTS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  name: 'Reports',
  icon: 'IconLayoutDashboard',
  position: 114,
  pageLayoutUniversalIdentifier: REPORTS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
