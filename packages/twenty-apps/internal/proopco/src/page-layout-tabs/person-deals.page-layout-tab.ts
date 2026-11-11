import {
  definePageLayoutTab,
  PageLayoutTabLayoutMode,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';


export default definePageLayoutTab({
  universalIdentifier: '79c68def-f027-4e6a-9ec9-b95d040a88ca',
  pageLayoutUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.personRecordPage.universalIdentifier,
  title: 'Deals',
  position: 110,
  icon: 'IconTargetArrow',
  layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
  widgets: [
    {
      universalIdentifier: '51fb87dc-e198-4a72-9149-b8d423f9c311',
      title: 'Deals',
      type: 'FIELD',
      configuration: {
        configurationType: 'FIELD',
        fieldMetadataId: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.fields.pointOfContactForOpportunities.universalIdentifier,
        fieldDisplayMode: 'TABLE',
      },
    },
  ],
});
