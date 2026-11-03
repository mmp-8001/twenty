import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  OPT_OUTS_NAV_UNIVERSAL_IDENTIFIER,
  OPT_OUTS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: OPT_OUTS_NAV_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'SMS Opt-outs',
  icon: 'IconMessageOff',
  position: 201,
  viewUniversalIdentifier: OPT_OUTS_VIEW_UNIVERSAL_IDENTIFIER,
});
