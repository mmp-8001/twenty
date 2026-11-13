import {
  definePageLayoutTab,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PERSON_CODE_ACTIVATION_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/code-activation-contact.field';

export default definePageLayoutTab({
  universalIdentifier: '27241e64-d1f1-4e77-a49a-8603615db0f1',
  pageLayoutUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.personRecordPage.universalIdentifier,
  title: 'Code activations',
  position: 120,
  icon: 'IconTicket',
  layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
  widgets: [
    {
      universalIdentifier: '1e501122-9ecd-4d5c-ac1f-ce97b50dc815',
      title: 'Code activations',
      type: 'FIELD',
      configuration: {
        configurationType: 'FIELD',
        fieldMetadataId: PERSON_CODE_ACTIVATION_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
        fieldDisplayMode: 'TABLE',
      },
    },
  ],
});
