import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  USER_LIST_NAVIGATION_UNIVERSAL_IDENTIFIER,
  USER_LIST_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: USER_LIST_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'User list',
  icon: 'IconUsers',
  position: 102,
  viewUniversalIdentifier: USER_LIST_VIEW_UNIVERSAL_IDENTIFIER,
});
