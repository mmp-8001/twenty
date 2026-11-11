import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  MY_FOLLOW_UPS_NAV_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: MY_FOLLOW_UPS_NAV_UNIVERSAL_IDENTIFIER,
  position: 5,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: MY_FOLLOW_UPS_VIEW_UNIVERSAL_IDENTIFIER,
});
