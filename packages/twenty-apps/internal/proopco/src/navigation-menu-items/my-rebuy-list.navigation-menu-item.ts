import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  MY_REBUY_LIST_NAV_UNIVERSAL_IDENTIFIER,
  MY_REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { visibleToRoles } from 'src/navigation-menu-items/utils/visible-to-roles.util';

export default defineNavigationMenuItem({
  universalIdentifier: MY_REBUY_LIST_NAV_UNIVERSAL_IDENTIFIER,
  position: -4,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: MY_REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  ...visibleToRoles(
    AGENT_ROLE_UNIVERSAL_IDENTIFIER,
    SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
  ),
});
