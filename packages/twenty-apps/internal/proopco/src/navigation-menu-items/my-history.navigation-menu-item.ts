import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  MY_HISTORY_NAV_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Reports, the seventh item, is a hand-made dashboard added in the runbook; the manifest cannot point at it.
export default defineNavigationMenuItem({
  universalIdentifier: MY_HISTORY_NAV_UNIVERSAL_IDENTIFIER,
  position: 4,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: MY_HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
});
