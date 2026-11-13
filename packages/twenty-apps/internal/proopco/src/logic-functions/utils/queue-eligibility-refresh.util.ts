import { enqueueJobs } from 'twenty-sdk/logic-function';

import { ELIGIBILITY_REFRESH_JOB_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { eligibilityRefreshJobOf } from 'src/utils/eligibility-refresh-window.util';

export const queueEligibilityRefresh = async () => {
  const { jobId, delayMs } = eligibilityRefreshJobOf(new Date());

  await enqueueJobs({
    logicFunctionUniversalIdentifier: ELIGIBILITY_REFRESH_JOB_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
    jobs: [{ payload: {}, jobId }],
    delayMs,
  });
};
