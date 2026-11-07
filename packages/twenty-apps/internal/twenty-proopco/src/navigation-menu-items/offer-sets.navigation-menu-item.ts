import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  OFFER_SETS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  OFFER_SETS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: OFFER_SETS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Offer Sets',
  icon: 'IconListDetails',
  position: 131,
  viewUniversalIdentifier: OFFER_SETS_VIEW_UNIVERSAL_IDENTIFIER,
});
