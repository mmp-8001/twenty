import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  COMMISSION_TIERS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  COMMISSION_TIERS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: COMMISSION_TIERS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Commission Tiers',
  icon: 'IconPercentage',
  position: 103,
  viewUniversalIdentifier: COMMISSION_TIERS_VIEW_UNIVERSAL_IDENTIFIER,
});
