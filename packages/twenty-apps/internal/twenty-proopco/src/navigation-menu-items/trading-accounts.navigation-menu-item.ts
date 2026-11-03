import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  TRADING_ACCOUNTS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  TRADING_ACCOUNTS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: TRADING_ACCOUNTS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Trading Accounts',
  icon: 'IconChartCandle',
  position: 100,
  viewUniversalIdentifier: TRADING_ACCOUNTS_VIEW_UNIVERSAL_IDENTIFIER,
});
