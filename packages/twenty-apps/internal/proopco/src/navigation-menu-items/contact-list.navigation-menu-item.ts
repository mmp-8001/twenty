import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  CONTACT_LIST_NAV_UNIVERSAL_IDENTIFIER,
  CONTACT_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { visibleToRoles } from 'src/navigation-menu-items/utils/visible-to-roles.util';

export default defineNavigationMenuItem({
  universalIdentifier: CONTACT_LIST_NAV_UNIVERSAL_IDENTIFIER,
  position: -5,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: CONTACT_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  ...visibleToRoles(
    AGENT_ROLE_UNIVERSAL_IDENTIFIER,
    SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
  ),
});
