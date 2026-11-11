import { defineLogicFunction } from 'twenty-sdk/define';

import { MONTHLY_INCOME_ROLLUP_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { rollUpMonthlyIncomes } from 'src/logic-functions/utils/monthly-income-rollup.util';

export const runMonthlyIncomeRollup = (now: Date) => rollUpMonthlyIncomes(applicationClients().client, now);

// 21:30 UTC is 01:00 Tehran; a missed run is caught up by the next one because the marker, not the day, decides.
export default defineLogicFunction({
  universalIdentifier: MONTHLY_INCOME_ROLLUP_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'monthly-income-rollup',
  description: 'Daily: after a Jalali month closes, rolls each agent\'s commission into a Monthly income record.',
  timeoutSeconds: 300,
  handler: () => runMonthlyIncomeRollup(new Date()),
  cronTriggerSettings: { pattern: '30 21 * * *' },
});
