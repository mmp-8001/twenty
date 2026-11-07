import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  REBUY_LIST_NAVIGATION_UNIVERSAL_IDENTIFIER,
  REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: REBUY_LIST_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Rebuy list',
  icon: 'IconRefresh',
  position: 104,
  viewUniversalIdentifier: REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER,
});
