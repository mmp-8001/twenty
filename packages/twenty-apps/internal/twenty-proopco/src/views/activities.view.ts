import {
  defineView,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
  ViewFilterOperand,
  ViewType,
} from 'twenty-sdk/define';

import {
  ACTIVITIES_VIEW_UNIVERSAL_IDENTIFIER,
  TASK_ACTIVITY_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const task = STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task;

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const GROUP_IDS = [
  '1b42d30c-6fbc-45f0-95d4-25bdbf017a38',
  '8f3a9c46-fdc3-4197-bc0f-096c04e33369',
  'fc51b280-19de-4836-9e51-04b1b08c0090',
];

export default defineView({
  universalIdentifier: ACTIVITIES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Activities',
  objectUniversalIdentifier: task.universalIdentifier,
  type: ViewType.KANBAN,
  icon: 'IconCheckbox',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier:
    task.fields.status.universalIdentifier,
  fields: [
    {
      universalIdentifier: '45ef5565-d40c-459b-8462-5e9cca640911',
      fieldMetadataUniversalIdentifier: task.fields.title.universalIdentifier,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: '3f89539d-0a86-49c7-9204-ea89ecc14f85',
      fieldMetadataUniversalIdentifier:
        TASK_ACTIVITY_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '03e1b78f-99f4-41b6-9b04-e2ed011754dd',
      fieldMetadataUniversalIdentifier: task.fields.dueAt.universalIdentifier,
      position: 2,
      isVisible: true,
      size: 140,
    },
  ],
  groups: STATUSES.map((status, index) => ({
    universalIdentifier: GROUP_IDS[index],
    fieldValue: status,
    position: index,
    isVisible: true,
  })),
  filters: [
    {
      universalIdentifier: '1f88aecd-0f7b-4d94-9741-5cdd8a8a6c23',
      fieldMetadataUniversalIdentifier:
        TASK_ACTIVITY_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS_NOT_EMPTY,
      value: '',
    },
  ],
});
