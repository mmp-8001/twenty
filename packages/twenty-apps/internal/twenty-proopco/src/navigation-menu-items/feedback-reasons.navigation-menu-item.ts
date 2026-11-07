import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  FEEDBACK_REASONS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASONS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: FEEDBACK_REASONS_NAVIGATION_UNIVERSAL_IDENTIFIER,
  type: NavigationMenuItemType.VIEW,
  name: 'Feedback Reasons',
  icon: 'IconMoodSmile',
  position: 120,
  viewUniversalIdentifier: FEEDBACK_REASONS_VIEW_UNIVERSAL_IDENTIFIER,
});
