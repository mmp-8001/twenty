import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  SEGMENTS_NAV_UNIVERSAL_IDENTIFIER,
  SEGMENTS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: SEGMENTS_NAV_UNIVERSAL_IDENTIFIER,
  position: 1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: SEGMENTS_VIEW_UNIVERSAL_IDENTIFIER,
});
