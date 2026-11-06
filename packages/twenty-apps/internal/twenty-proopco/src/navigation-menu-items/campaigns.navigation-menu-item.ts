import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  CAMPAIGNS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  CAMPAIGNS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: CAMPAIGNS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Campaigns',
  icon: 'IconSpeakerphone',
  position: 100,
  viewUniversalIdentifier: CAMPAIGNS_VIEW_UNIVERSAL_IDENTIFIER,
});
