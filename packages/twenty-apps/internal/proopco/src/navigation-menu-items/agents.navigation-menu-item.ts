import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  AGENTS_NAV_UNIVERSAL_IDENTIFIER,
  AGENTS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: AGENTS_NAV_UNIVERSAL_IDENTIFIER,
  position: 3,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: AGENTS_VIEW_UNIVERSAL_IDENTIFIER,
});
