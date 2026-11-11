import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_DEAL_STAGE_FIELD_UNIVERSAL_IDENTIFIER =
  'ce37a9c6-d7ec-4386-acc6-92b9daf1d8bd';

export default defineField({
  universalIdentifier: OPPORTUNITY_DEAL_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.SELECT,
  name: 'dealStage',
  label: 'Deal stage',
  icon: 'IconRoute',
  defaultValue: "'AWAITING_FIRST_CALL'",
  options: [
    {
      id: '20545447-cca3-4455-974f-677546e95183',
      value: 'AWAITING_FIRST_CALL',
      label: 'Awaiting first call',
      position: 0,
      color: 'blue',
    },
    {
      id: '90f95f21-c64b-4be7-b267-bdbef614e795',
      value: 'IN_FOLLOW_UP',
      label: 'In follow-up',
      position: 1,
      color: 'turquoise',
    },
    {
      id: '31a11f9c-53c0-4c96-8325-c146eb1c179d',
      value: 'REBUY_WINDOW',
      label: 'Rebuy window',
      position: 2,
      color: 'purple',
    },
    {
      id: '90617135-10dd-4efa-8dc9-86b40d8a2778',
      value: 'WON',
      label: 'Won',
      position: 3,
      color: 'green',
    },
    {
      id: '862da1d0-5997-450e-b07a-2b62ef93c55e',
      value: 'LOST',
      label: 'Lost',
      position: 4,
      color: 'red',
    },
    {
      id: '8bd42c2c-dc0f-45c2-a53e-cd4bc8260e14',
      value: 'VOID',
      label: 'Void',
      position: 5,
      color: 'gray',
    },
  ],
});
