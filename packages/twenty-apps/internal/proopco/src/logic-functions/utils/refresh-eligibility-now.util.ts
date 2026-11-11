import { applicationClients } from 'src/logic-functions/utils/default-clients.util';
import { runEligibilityRefresh } from 'src/logic-functions/utils/refresh-eligibility.util';

export const refreshEligibilityNow = () => {
  const { client, metadata } = applicationClients();

  return runEligibilityRefresh(new Date(), client, metadata);
};
