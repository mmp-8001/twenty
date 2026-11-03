import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  PAYMENTS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  PAYMENTS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: PAYMENTS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Payments',
  icon: 'IconCash',
  position: 101,
  viewUniversalIdentifier: PAYMENTS_VIEW_UNIVERSAL_IDENTIFIER,
});
