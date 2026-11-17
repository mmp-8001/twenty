import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SEGMENTS_NAV_UNIVERSAL_IDENTIFIER,
  SEGMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { visibleToRoles } from 'src/navigation-menu-items/utils/visible-to-roles.util';

export default defineNavigationMenuItem({
  universalIdentifier: SEGMENTS_NAV_UNIVERSAL_IDENTIFIER,
  position: -15,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: SEGMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  ...visibleToRoles(
    SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
    FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
    ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  ),
});
