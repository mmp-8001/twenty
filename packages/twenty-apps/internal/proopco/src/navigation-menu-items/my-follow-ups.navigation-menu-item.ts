import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  MY_FOLLOW_UPS_NAV_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: MY_FOLLOW_UPS_NAV_UNIVERSAL_IDENTIFIER,
  name: 'My follow-ups',
  icon: 'IconPhoneCall',
  position: 1,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: MY_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
});
