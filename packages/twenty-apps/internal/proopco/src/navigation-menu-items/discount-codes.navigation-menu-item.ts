import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODES_NAV_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODES_VIEW_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { visibleToRoles } from 'src/navigation-menu-items/utils/visible-to-roles.util';

export default defineNavigationMenuItem({
  universalIdentifier: DISCOUNT_CODES_NAV_UNIVERSAL_IDENTIFIER,
  position: -10,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: DISCOUNT_CODES_VIEW_UNIVERSAL_IDENTIFIER,
  ...visibleToRoles(
    FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
    ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  ),
});
