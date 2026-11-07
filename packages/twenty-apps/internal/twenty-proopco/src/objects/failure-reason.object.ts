import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  FAILURE_REASON_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
  FAILURE_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  FAILURE_REASON_SORT_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
  FAILURE_REASON_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: FAILURE_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'failureReason',
  namePlural: 'failureReasons',
  labelSingular: 'Failure Reason',
  labelPlural: 'Failure Reasons',
  description: 'Why a User is moved to permanent failure. Deactivate, never delete.',
  icon: 'IconFlag',
  disabledObjectPermissionActions: [
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  labelIdentifierFieldMetadataUniversalIdentifier:
    FAILURE_REASON_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: FAILURE_REASON_TITLE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'title',
      label: 'Title',
      icon: 'IconTag',
    },
    {
      universalIdentifier: FAILURE_REASON_IS_ACTIVE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.BOOLEAN,
      name: 'isActive',
      label: 'Active',
      icon: 'IconToggleRight',
      defaultValue: true,
    },
    {
      universalIdentifier: FAILURE_REASON_SORT_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'sortOrder',
      label: 'Sort order',
      icon: 'IconSortAscending',
      defaultValue: 0,
    },
  ],
});
