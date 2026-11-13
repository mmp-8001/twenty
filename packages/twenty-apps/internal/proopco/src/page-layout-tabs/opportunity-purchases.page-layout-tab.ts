import {
  definePageLayoutTab,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { OPPORTUNITY_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/purchase-deal.field';

export default definePageLayoutTab({
  universalIdentifier: 'b8c682d9-aff4-4a6b-9905-450699d1994b',
  pageLayoutUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.universalIdentifier,
  title: 'Purchases',
  position: 110,
  icon: 'IconCoin',
  layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
  widgets: [
    {
      universalIdentifier: '7e2d4b69-127e-4a1d-8eb7-1e44682afa59',
      title: 'Purchases',
      type: 'FIELD',
      configuration: {
        configurationType: 'FIELD',
        fieldMetadataId: OPPORTUNITY_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
        fieldDisplayMode: 'TABLE',
      },
    },
  ],
});
