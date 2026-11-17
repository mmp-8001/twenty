import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  REASONS_NAV_UNIVERSAL_IDENTIFIER,
  REASONS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { visibleToRoles } from 'src/navigation-menu-items/utils/visible-to-roles.util';

export default defineNavigationMenuItem({
  universalIdentifier: REASONS_NAV_UNIVERSAL_IDENTIFIER,
  position: -9,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: REASONS_VIEW_UNIVERSAL_IDENTIFIER,
  ...visibleToRoles(
    FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
    ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  ),
});
