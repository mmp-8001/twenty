import {
  definePageLayoutTab,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { OPPORTUNITY_CALLS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/call-deal.field';

export default definePageLayoutTab({
  universalIdentifier: '5174795e-bd2b-4cac-b60e-c165cc86503b',
  pageLayoutUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.universalIdentifier,
  title: 'Calls',
  position: 100,
  icon: 'IconPhone',
  layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
  widgets: [
    {
      universalIdentifier: 'b521c7ce-07f4-4839-8c13-a02941d23c07',
      title: 'Calls',
      type: 'FIELD',
      configuration: {
        configurationType: 'FIELD',
        fieldMetadataId: OPPORTUNITY_CALLS_FIELD_UNIVERSAL_IDENTIFIER,
        fieldDisplayMode: 'TABLE',
      },
    },
  ],
});
