import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export const CODE_ACTIVATION_CALL_FIELD_UNIVERSAL_IDENTIFIER =
  '953ce10f-8fc9-45d8-b73e-16f3ea358c8c';
export const CALL_CODE_ACTIVATION_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER =
  'aec547af-2bb6-46a1-95c1-df887b83abf4';

export default defineField({
  universalIdentifier: CODE_ACTIVATION_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: CODE_ACTIVATION_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'call',
  label: 'Call',
  icon: 'IconPhone',
  relationTargetObjectMetadataUniversalIdentifier:
    CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    CALL_CODE_ACTIVATION_CODE_ACTIVATIONS_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'callId',
  },
});
