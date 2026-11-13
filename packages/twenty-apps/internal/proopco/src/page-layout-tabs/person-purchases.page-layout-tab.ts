import {
  definePageLayoutTab,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PERSON_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/purchase-contact.field';

export default definePageLayoutTab({
  universalIdentifier: 'e9de0725-4378-487e-bed9-07a0dd718c1b',
  pageLayoutUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.personRecordPage.universalIdentifier,
  title: 'Purchases',
  position: 130,
  icon: 'IconCoin',
  layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
  widgets: [
    {
      universalIdentifier: '4e81fed9-1041-41c9-aa30-cabf408160fd',
      title: 'Purchases',
      type: 'FIELD',
      configuration: {
        configurationType: 'FIELD',
        fieldMetadataId: PERSON_PURCHASES_FIELD_UNIVERSAL_IDENTIFIER,
        fieldDisplayMode: 'TABLE',
      },
    },
  ],
});
