import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_NAV_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { visibleToRoles } from 'src/navigation-menu-items/utils/visible-to-roles.util';

export default defineNavigationMenuItem({
  universalIdentifier: MY_FOLLOW_UPS_NAV_UNIVERSAL_IDENTIFIER,
  name: 'My follow-ups',
  icon: 'IconPhoneCall',
  position: -6,
  type: NavigationMenuItemType.PAGE_LAYOUT,
  pageLayoutUniversalIdentifier: MY_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  ...visibleToRoles(
    AGENT_ROLE_UNIVERSAL_IDENTIFIER,
    SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
  ),
});
