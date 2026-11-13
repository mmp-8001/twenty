import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CONTACT_LIST_NAV_UNIVERSAL_IDENTIFIER,
  CONTACT_LIST_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: CONTACT_LIST_NAV_UNIVERSAL_IDENTIFIER,
  position: 0,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CONTACT_LIST_VIEW_UNIVERSAL_IDENTIFIER,
});
