import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CAMPAIGNS_NAV_UNIVERSAL_IDENTIFIER,
  CAMPAIGNS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: CAMPAIGNS_NAV_UNIVERSAL_IDENTIFIER,
  position: 2,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CAMPAIGNS_VIEW_UNIVERSAL_IDENTIFIER,
});
