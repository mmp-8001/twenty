import {
  definePageLayoutTab,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';


export default definePageLayoutTab({
  universalIdentifier: 'db462bb8-5b39-4633-98f6-7ab48669b370',
  pageLayoutUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.personRecordPage.universalIdentifier,
  title: 'Notes',
  position: 140,
  icon: 'IconNotes',
  layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
  widgets: [
    {
      universalIdentifier: '1a6ffd25-0653-4783-8881-777a22c88fab',
      title: 'Notes',
      type: 'NOTES',
      configuration: { configurationType: 'NOTES' },
    },
  ],
});
