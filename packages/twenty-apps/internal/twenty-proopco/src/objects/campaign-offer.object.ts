import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OFFER_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OFFER_OBJECT_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OFFER_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OFFERS_ON_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
  CAMPAIGN_OFFERS_ON_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const manyToOne = (joinColumnName: string) => ({
  relationType: RelationType.MANY_TO_ONE,
  onDelete: OnDeleteAction.SET_NULL,
  joinColumnName,
});

// Links an existing Offer to a Campaign: the Supervisor's only write on offers (AS1).
export default defineObject({
  universalIdentifier: CAMPAIGN_OFFER_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'campaignOffer',
  namePlural: 'campaignOffers',
  labelSingular: 'Campaign Offer',
  labelPlural: 'Campaign Offers',
  description: 'An Offer a Campaign may give out at the end of an answered call.',
  icon: 'IconLink',
  disabledObjectPermissionActions: ['canDestroyObjectRecords'],
  fields: [
    {
      universalIdentifier: CAMPAIGN_OFFER_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'campaign',
      label: 'Campaign',
      icon: 'IconSpeakerphone',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier: CAMPAIGN_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CAMPAIGN_OFFERS_ON_CAMPAIGN_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: manyToOne('campaignId'),
    },
    {
      universalIdentifier: CAMPAIGN_OFFER_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'offer',
      label: 'Offer',
      icon: 'IconDiscount2',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier: OFFER_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CAMPAIGN_OFFERS_ON_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: manyToOne('offerId'),
    },
  ],
});
