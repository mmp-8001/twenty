import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';

import {
  HISTORY_NAVIGATION_UNIVERSAL_IDENTIFIER,
  HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: HISTORY_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'History',
  icon: 'IconHistory',
  position: 113,
  viewUniversalIdentifier: HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
});
