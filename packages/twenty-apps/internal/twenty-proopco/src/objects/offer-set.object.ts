import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import { OFFER_SET_TYPES } from 'src/constants/offer.constant';
import {
  OFFER_OBJECT_UNIVERSAL_IDENTIFIER,
  OFFER_SET_OBJECT_UNIVERSAL_IDENTIFIER,
  OFFER_SET_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_SET_SET_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_SETS_ON_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { buildSelectOptions } from 'src/utils/build-select-options.util';

// Global sets only the Full Admin edits: the Offers shown on rebuy cases and retention calls.
export default defineObject({
  universalIdentifier: OFFER_SET_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'offerSet',
  namePlural: 'offerSets',
  labelSingular: 'Offer Set entry',
  labelPlural: 'Offer Sets',
  description: 'An Offer in the global rebuy or retention set.',
  icon: 'IconListDetails',
  disabledObjectPermissionActions: ['canDestroyObjectRecords'],
  fields: [
    {
      universalIdentifier: OFFER_SET_SET_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'setType',
      label: 'Set',
      icon: 'IconCategory',
      defaultValue: "'REBUY'",
      options: buildSelectOptions('offerSet.setType', OFFER_SET_TYPES),
    },
    {
      universalIdentifier: OFFER_SET_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'offer',
      label: 'Offer',
      icon: 'IconDiscount2',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier: OFFER_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier: OFFER_SETS_ON_OFFER_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'offerId',
      },
    },
  ],
});
