import { defineNavigationMenuItem, NavigationMenuItemType } from 'twenty-sdk/define';

import {
  MONTHLY_INCOMES_NAVIGATION_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOMES_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: MONTHLY_INCOMES_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Monthly incomes',
  icon: 'IconCoin',
  position: 111,
  viewUniversalIdentifier: MONTHLY_INCOMES_VIEW_UNIVERSAL_IDENTIFIER,
});
