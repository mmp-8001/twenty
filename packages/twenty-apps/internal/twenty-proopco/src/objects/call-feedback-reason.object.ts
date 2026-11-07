import {
  defineObject,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  CALL_FEEDBACK_REASON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  CALL_FEEDBACK_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  CALL_FEEDBACK_REASON_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  CALL_OBJECT_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_LINKS_ON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
  CALL_LINKS_ON_FEEDBACK_REASON_FIELD_UNIVERSAL_IDENTIFIER,
  FEEDBACK_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Junction: one row per reason chosen on a Call.
export default defineObject({
  universalIdentifier: CALL_FEEDBACK_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'callFeedbackReason',
  namePlural: 'callFeedbackReasons',
  labelSingular: 'Call Feedback Reason',
  labelPlural: 'Call Feedback Reasons',
  description: 'A Feedback Reason chosen on a Call. Permanent.',
  icon: 'IconLink',
  disabledObjectPermissionActions: [
    'canSoftDeleteObjectRecords',
    'canDestroyObjectRecords',
  ],
  fields: [
    {
      universalIdentifier: CALL_FEEDBACK_REASON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'call',
      label: 'Call',
      icon: 'IconPhone',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        CALL_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        FEEDBACK_REASON_LINKS_ON_CALL_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'callId',
      },
    },
    {
      universalIdentifier: CALL_FEEDBACK_REASON_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RELATION,
      name: 'feedbackReason',
      label: 'Feedback Reason',
      icon: 'IconMoodSmile',
      isNullable: true,
      relationTargetObjectMetadataUniversalIdentifier:
        FEEDBACK_REASON_OBJECT_UNIVERSAL_IDENTIFIER,
      relationTargetFieldMetadataUniversalIdentifier:
        CALL_LINKS_ON_FEEDBACK_REASON_FIELD_UNIVERSAL_IDENTIFIER,
      universalSettings: {
        relationType: RelationType.MANY_TO_ONE,
        onDelete: OnDeleteAction.SET_NULL,
        joinColumnName: 'feedbackReasonId',
      },
    },
  ],
});
