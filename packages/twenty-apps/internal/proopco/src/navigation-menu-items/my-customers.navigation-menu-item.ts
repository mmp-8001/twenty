import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  MY_CUSTOMERS_NAV_UNIVERSAL_IDENTIFIER,
  MY_CUSTOMERS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: MY_CUSTOMERS_NAV_UNIVERSAL_IDENTIFIER,
  position: 3,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: MY_CUSTOMERS_VIEW_UNIVERSAL_IDENTIFIER,
});
