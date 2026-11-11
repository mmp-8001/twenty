import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CALLS_NAV_UNIVERSAL_IDENTIFIER,
  CALLS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: CALLS_NAV_UNIVERSAL_IDENTIFIER,
  position: 5,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CALLS_VIEW_UNIVERSAL_IDENTIFIER,
});
