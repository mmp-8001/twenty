import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  OFFERS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  OFFERS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: OFFERS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Offers',
  icon: 'IconDiscount2',
  position: 130,
  viewUniversalIdentifier: OFFERS_VIEW_UNIVERSAL_IDENTIFIER,
});
