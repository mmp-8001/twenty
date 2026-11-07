import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_ADMINS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_ADMINS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: CAMPAIGN_ADMINS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Campaign Agents',
  icon: 'IconUserPlus',
  position: 101,
  viewUniversalIdentifier: CAMPAIGN_ADMINS_VIEW_UNIVERSAL_IDENTIFIER,
});
