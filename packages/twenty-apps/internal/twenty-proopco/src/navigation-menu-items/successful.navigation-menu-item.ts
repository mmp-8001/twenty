import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  SUCCESSFUL_NAVIGATION_UNIVERSAL_IDENTIFIER,
  SUCCESSFUL_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: SUCCESSFUL_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Successful',
  icon: 'IconTrophy',
  position: 105,
  viewUniversalIdentifier: SUCCESSFUL_VIEW_UNIVERSAL_IDENTIFIER,
});
