import {
  defineView,
  ViewType,
} from 'twenty-sdk/define';

import { FOLLOWUP_STAGE_OPTIONS } from 'src/constants/followup.constant';
import {
  FOLLOWUP_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_RETRY_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUP_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  FOLLOWUPS_VIEW_UNIVERSAL_IDENTIFIER,
  OWNER_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
  TRADER_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

const GROUP_IDS = [
  '998815af-2a24-4f8b-a82f-19f9859ba0ac',
  'dcf52cf9-109a-4625-820d-658cbf0e2eed',
  '17c612f5-3959-4ada-9637-b4d2dfc74089',
  'cdd2c24f-a184-408a-879e-c0feffae0d82',
  '2de0a6cd-a87d-4526-88bd-9c8231f86771',
];

export default defineView({
  universalIdentifier: FOLLOWUPS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Followups',
  objectUniversalIdentifier: FOLLOWUP_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.KANBAN,
  icon: 'IconLayoutKanban',
  position: 0,
  mainGroupByFieldMetadataUniversalIdentifier: FOLLOWUP_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: 'fc1d6056-79c7-4874-a130-be563bf1d169',
      fieldMetadataUniversalIdentifier:
        FOLLOWUP_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'aa722159-79d8-4fc0-871e-1408d5a43030',
      fieldMetadataUniversalIdentifier:
        TRADER_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'e7270218-407a-48a7-8834-9f31d6f02229',
      fieldMetadataUniversalIdentifier:
        OWNER_ON_FOLLOWUP_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: '77fdbd03-c7c0-4139-9d0e-283633a92a51',
      fieldMetadataUniversalIdentifier:
        FOLLOWUP_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: 'd6696270-c93d-42fa-b798-22a3c58f77d7',
      fieldMetadataUniversalIdentifier:
        FOLLOWUP_RETRY_EXPIRES_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 160,
    },
  ],
  groups: FOLLOWUP_STAGE_OPTIONS.map((option, index) => ({
    universalIdentifier: GROUP_IDS[index],
    fieldValue: option.value,
    position: index,
    isVisible: true,
  })),
});
