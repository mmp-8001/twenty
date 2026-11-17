import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  CALLS_NAV_UNIVERSAL_IDENTIFIER,
  CALLS_VIEW_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { visibleToRoles } from 'src/navigation-menu-items/utils/visible-to-roles.util';

export default defineNavigationMenuItem({
  universalIdentifier: CALLS_NAV_UNIVERSAL_IDENTIFIER,
  position: -1,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CALLS_VIEW_UNIVERSAL_IDENTIFIER,
  ...visibleToRoles(
    AGENT_ROLE_UNIVERSAL_IDENTIFIER,
    SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
    ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  ),
});
