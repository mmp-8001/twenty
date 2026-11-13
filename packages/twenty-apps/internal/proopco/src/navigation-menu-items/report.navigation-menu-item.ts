import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  REPORT_NAV_UNIVERSAL_IDENTIFIER,
  REPORT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: REPORT_NAV_UNIVERSAL_IDENTIFIER,
  name: 'Report',
  icon: 'IconLayoutDashboard',
  position: 6,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: REPORT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
