import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  MY_HISTORY_NAV_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: MY_HISTORY_NAV_UNIVERSAL_IDENTIFIER,
  position: 4,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: MY_HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
});
