import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_NAV_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { visibleToRoles } from 'src/navigation-menu-items/utils/visible-to-roles.util';

export default defineNavigationMenuItem({
  universalIdentifier: MY_HISTORY_NAV_UNIVERSAL_IDENTIFIER,
  position: -2,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: MY_HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
  ...visibleToRoles(
    AGENT_ROLE_UNIVERSAL_IDENTIFIER,
    SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
  ),
});
