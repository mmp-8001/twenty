import {
  definePageLayoutTab,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PERSON_CALLS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/call-contact.field';

export default definePageLayoutTab({
  universalIdentifier: '9959d020-b8fd-4d2a-971c-0aaea4c753e7',
  pageLayoutUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.personRecordPage.universalIdentifier,
  title: 'Calls',
  position: 100,
  icon: 'IconPhone',
  layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
  widgets: [
    {
      universalIdentifier: '4580e902-98d0-4b63-b84b-ab2439666172',
      title: 'Calls',
      type: 'FIELD',
      configuration: {
        configurationType: 'FIELD',
        fieldMetadataId: PERSON_CALLS_FIELD_UNIVERSAL_IDENTIFIER,
        fieldDisplayMode: 'TABLE',
      },
    },
  ],
});
