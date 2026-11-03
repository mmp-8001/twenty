import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ACTIVITIES_NAVIGATION_UNIVERSAL_IDENTIFIER,
  ACTIVITIES_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: ACTIVITIES_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Activities',
  icon: 'IconCheckbox',
  position: 106,
  viewUniversalIdentifier: ACTIVITIES_VIEW_UNIVERSAL_IDENTIFIER,
});
