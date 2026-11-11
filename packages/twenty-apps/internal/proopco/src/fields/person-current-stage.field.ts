import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const PERSON_CURRENT_STAGE_FIELD_UNIVERSAL_IDENTIFIER =
  'f78df4e1-465f-470d-b8dd-4ba2cafeb235';

export default defineField({
  universalIdentifier: PERSON_CURRENT_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.SELECT,
  name: 'currentStage',
  label: 'Current stage',
  icon: 'IconStairs',
  isNullable: true,
  options: [
    {
      id: 'c0f004e1-5fff-4df5-816f-aa507ce0b75b',
      value: 'STEP_1',
      label: 'Step 1',
      position: 0,
      color: 'blue',
    },
    {
      id: '96245a0e-2d87-4362-8664-cee1d0d51fba',
      value: 'STEP_2',
      label: 'Step 2',
      position: 1,
      color: 'turquoise',
    },
    {
      id: 'fdd215d9-3929-4512-86f1-d3cc1d54a6dd',
      value: 'FUNDED',
      label: 'Funded',
      position: 2,
      color: 'green',
    },
  ],
});
