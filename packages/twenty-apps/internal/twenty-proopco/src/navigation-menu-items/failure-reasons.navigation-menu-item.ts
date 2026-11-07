import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  FAILURE_REASONS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  FAILURE_REASONS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: FAILURE_REASONS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Failure Reasons',
  icon: 'IconFlag',
  position: 110,
  viewUniversalIdentifier: FAILURE_REASONS_VIEW_UNIVERSAL_IDENTIFIER,
});
