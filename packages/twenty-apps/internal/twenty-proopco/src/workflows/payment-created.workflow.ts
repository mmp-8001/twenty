import { defineWorkflow } from 'twenty-sdk/define';

import {
  PAYMENT_CREATED_WORKFLOW_STEP_UNIVERSAL_IDENTIFIER,
  PAYMENT_CREATED_WORKFLOW_TRIGGER_UNIVERSAL_IDENTIFIER,
  PAYMENT_CREATED_WORKFLOW_UNIVERSAL_IDENTIFIER,
  PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
  PROOPCO_COMMISSION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineWorkflow({
  universalIdentifier: PAYMENT_CREATED_WORKFLOW_UNIVERSAL_IDENTIFIER,
  name: 'Payment created: create Commission',
  isSystem: true,
  version: {
    trigger: {
      universalIdentifier:
        PAYMENT_CREATED_WORKFLOW_TRIGGER_UNIVERSAL_IDENTIFIER,
      type: 'DATABASE_EVENT',
      settings: {
        objectUniversalIdentifier: PAYMENT_OBJECT_UNIVERSAL_IDENTIFIER,
        action: 'created',
      },
      nextStepIds: [PAYMENT_CREATED_WORKFLOW_STEP_UNIVERSAL_IDENTIFIER],
    },
    steps: [
      {
        universalIdentifier: PAYMENT_CREATED_WORKFLOW_STEP_UNIVERSAL_IDENTIFIER,
        name: 'Create Commission',
        type: 'LOGIC_FUNCTION',
        logicFunctionUniversalIdentifier:
          PROOPCO_COMMISSION_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
        input: { paymentId: '{{trigger.properties.after.id}}' },
        nextStepIds: [],
      },
    ],
  },
});
