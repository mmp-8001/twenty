import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  MESSAGES_NAV_UNIVERSAL_IDENTIFIER,
  MESSAGES_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: MESSAGES_NAV_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'SMS Messages',
  icon: 'IconMessage',
  position: 200,
  viewUniversalIdentifier: MESSAGES_VIEW_UNIVERSAL_IDENTIFIER,
});
