import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';

import {
  ADMINS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  ADMINS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: ADMINS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  name: 'Sales Team',
  icon: 'IconUsers',
  position: 110,
  pageLayoutUniversalIdentifier: ADMINS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
