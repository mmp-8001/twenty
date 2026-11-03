import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { TASK_ACTIVITY_TYPE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: TASK_ACTIVITY_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
  type: FieldType.SELECT,
  name: 'activityType',
  label: 'Activity type',
  icon: 'IconListCheck',
  isNullable: true,
  options: [
    { id: '2c3d4e5f-6a7b-4c8d-9e9f-1a2b3c4d5e01', value: 'CALL', label: 'Call', position: 0, color: 'green' },
    { id: '3d4e5f6a-7b8c-4d9e-8f0a-2b3c4d5e6f02', value: 'SMS', label: 'SMS', position: 1, color: 'blue' },
    { id: '4e5f6a7b-8c9d-4e0f-9a1b-3c4d5e6f7a03', value: 'EMAIL', label: 'Email', position: 2, color: 'purple' },
    { id: '5f6a7b8c-9d0e-4f1a-8b2c-4d5e6f7a8b04', value: 'MEETING', label: 'Meeting', position: 3, color: 'orange' },
    { id: '6a7b8c9d-0e1f-4a2b-9c3d-5e6f7a8b9c05', value: 'OTHER', label: 'Other', position: 4, color: 'gray' },
  ],
});
