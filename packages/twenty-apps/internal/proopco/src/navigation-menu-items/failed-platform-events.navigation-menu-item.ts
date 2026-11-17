import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  FAILED_PLATFORM_EVENTS_NAV_UNIVERSAL_IDENTIFIER,
  FAILED_PLATFORM_EVENTS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { visibleToRoles } from 'src/navigation-menu-items/utils/visible-to-roles.util';

export default defineNavigationMenuItem({
  universalIdentifier: FAILED_PLATFORM_EVENTS_NAV_UNIVERSAL_IDENTIFIER,
  position: -7,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: FAILED_PLATFORM_EVENTS_VIEW_UNIVERSAL_IDENTIFIER,
  ...visibleToRoles(ADMIN_ROLE_UNIVERSAL_IDENTIFIER),
});
