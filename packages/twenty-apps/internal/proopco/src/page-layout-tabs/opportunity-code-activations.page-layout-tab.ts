import {
  definePageLayoutTab,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { OPPORTUNITY_CODE_ACTIVATION_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/code-activation-deal.field';

export default definePageLayoutTab({
  universalIdentifier: '3c3ad6ba-fe91-4ab4-926f-44e622dc1a6a',
  pageLayoutUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage.universalIdentifier,
  title: 'Code activations',
  position: 120,
  icon: 'IconTicket',
  layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
  widgets: [
    {
      universalIdentifier: 'c8671f03-47ff-4dfb-bba6-85b9dda63f13',
      title: 'Code activations',
      type: 'FIELD',
      configuration: {
        configurationType: 'FIELD',
        fieldMetadataId: OPPORTUNITY_CODE_ACTIVATION_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
        fieldDisplayMode: 'TABLE',
      },
    },
  ],
});
