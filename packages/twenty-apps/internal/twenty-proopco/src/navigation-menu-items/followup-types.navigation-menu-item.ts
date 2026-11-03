import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  FOLLOWUP_TYPES_NAVIGATION_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_TYPES_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: FOLLOWUP_TYPES_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Followup Types',
  icon: 'IconListDetails',
  position: 102,
  viewUniversalIdentifier: FOLLOWUP_TYPES_VIEW_UNIVERSAL_IDENTIFIER,
});
