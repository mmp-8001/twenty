import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  FOLLOWUPS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  FOLLOWUPS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: FOLLOWUPS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Followups',
  icon: 'IconLayoutKanban',
  position: 100,
  viewUniversalIdentifier: FOLLOWUPS_VIEW_UNIVERSAL_IDENTIFIER,
});
