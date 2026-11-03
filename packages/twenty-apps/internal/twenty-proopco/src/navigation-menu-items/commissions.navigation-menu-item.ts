import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  COMMISSIONS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  COMMISSIONS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: COMMISSIONS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Commissions',
  icon: 'IconCoin',
  position: 104,
  viewUniversalIdentifier: COMMISSIONS_VIEW_UNIVERSAL_IDENTIFIER,
});
