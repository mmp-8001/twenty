import { defineObject, FieldType } from 'twenty-sdk/define';

import { OFFER_CAPABILITIES, OFFER_STATUSES } from 'src/constants/offer.constant';
import {
  OFFER_CAPABILITY_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_DEACTIVATED_AT_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_DEACTIVATED_BY_ID_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_DISCOUNT_PARAMS_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_OBJECT_UNIVERSAL_IDENTIFIER,
  OFFER_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  OFFER_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { buildSelectOptions } from 'src/utils/build-select-options.util';

// CODE-09: an Offer is deactivated, never deleted. Only the Full Admin creates one (CODE-03).
export default defineObject({
  universalIdentifier: OFFER_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'offer',
  namePlural: 'offers',
  labelSingular: 'Offer',
  labelPlural: 'Offers',
  description: 'A discount code defined by the Full Admin, with one fixed expiry.',
  icon: 'IconDiscount2',
  disabledObjectPermissionActions: ['canSoftDeleteObjectRecords', 'canDestroyObjectRecords'],
  labelIdentifierFieldMetadataUniversalIdentifier: OFFER_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: OFFER_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'title',
      label: 'Title',
      icon: 'IconTag',
    },
    {
      universalIdentifier: OFFER_CAPABILITY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'capability',
      label: 'Capability',
      icon: 'IconBolt',
      defaultValue: "'DISCOUNT'",
      options: buildSelectOptions('offer.capability', OFFER_CAPABILITIES),
    },
    {
      universalIdentifier: OFFER_DISCOUNT_PARAMS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RAW_JSON,
      name: 'discountParams',
      label: 'Code parameters',
      description: 'Sent as is to the proopco code service.',
      icon: 'IconBraces',
      isNullable: true,
    },
    {
      universalIdentifier: OFFER_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'expiresAt',
      label: 'Expires at',
      description: 'One fixed moment for every User, not a duration from activation.',
      icon: 'IconCalendarX',
    },
    {
      universalIdentifier: OFFER_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconToggleRight',
      defaultValue: "'ACTIVE'",
      options: buildSelectOptions('offer.status', OFFER_STATUSES),
    },
    {
      universalIdentifier: OFFER_DEACTIVATED_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'deactivatedAt',
      label: 'Deactivated at',
      icon: 'IconCalendarOff',
      isNullable: true,
    },
    {
      universalIdentifier: OFFER_DEACTIVATED_BY_ID_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'deactivatedById',
      label: 'Deactivated by (member id)',
      icon: 'IconUserOff',
      isNullable: true,
    },
  ],
});
