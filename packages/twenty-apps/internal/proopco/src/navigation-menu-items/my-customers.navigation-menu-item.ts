import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  MY_CUSTOMERS_NAV_UNIVERSAL_IDENTIFIER,
  MY_CUSTOMERS_VIEW_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { visibleToRoles } from 'src/navigation-menu-items/utils/visible-to-roles.util';

export default defineNavigationMenuItem({
  universalIdentifier: MY_CUSTOMERS_NAV_UNIVERSAL_IDENTIFIER,
  position: -3,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: MY_CUSTOMERS_VIEW_UNIVERSAL_IDENTIFIER,
  ...visibleToRoles(
    AGENT_ROLE_UNIVERSAL_IDENTIFIER,
    SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
  ),
});
