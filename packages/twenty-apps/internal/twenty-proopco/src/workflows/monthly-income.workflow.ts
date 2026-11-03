import { defineWorkflow } from 'twenty-sdk/define';

import {
  MONTHLY_INCOME_WORKFLOW_STEP_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_WORKFLOW_TRIGGER_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOME_WORKFLOW_UNIVERSAL_IDENTIFIER,
  PROOPCO_MONTHLY_INCOME_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineWorkflow({
  universalIdentifier: MONTHLY_INCOME_WORKFLOW_UNIVERSAL_IDENTIFIER,
  name: 'Monthly: create Monthly Incomes',
  isSystem: true,
  version: {
    trigger: {
      universalIdentifier:
        MONTHLY_INCOME_WORKFLOW_TRIGGER_UNIVERSAL_IDENTIFIER,
      type: 'CRON',
      settings: { type: 'CUSTOM', pattern: '0 3 1 * *' },
      nextStepIds: [MONTHLY_INCOME_WORKFLOW_STEP_UNIVERSAL_IDENTIFIER],
    },
    steps: [
      {
        universalIdentifier: MONTHLY_INCOME_WORKFLOW_STEP_UNIVERSAL_IDENTIFIER,
        name: 'Create Monthly Incomes',
        type: 'LOGIC_FUNCTION',
        logicFunctionUniversalIdentifier:
          PROOPCO_MONTHLY_INCOME_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
        input: {},
        nextStepIds: [],
      },
    ],
  },
});
