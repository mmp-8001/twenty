import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  MY_REBUY_LIST_NAV_UNIVERSAL_IDENTIFIER,
  MY_REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: MY_REBUY_LIST_NAV_UNIVERSAL_IDENTIFIER,
  position: 7,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: MY_REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER,
});
