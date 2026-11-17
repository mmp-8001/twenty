import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  CAMPAIGNS_NAV_UNIVERSAL_IDENTIFIER,
  CAMPAIGNS_VIEW_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { visibleToRoles } from 'src/navigation-menu-items/utils/visible-to-roles.util';

export default defineNavigationMenuItem({
  universalIdentifier: CAMPAIGNS_NAV_UNIVERSAL_IDENTIFIER,
  position: -16,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CAMPAIGNS_VIEW_UNIVERSAL_IDENTIFIER,
  ...visibleToRoles(
    SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
    FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
    ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  ),
});
