import { isRateLimitError } from 'src/logic-functions/utils/rate-limit-error.util';
import { type RecordsClient } from 'src/logic-functions/utils/records.util';

const RETRY_DELAY_MS = 10_000;
const MAX_ATTEMPTS = 12;

const withRetry = async <TResult>(run: () => Promise<TResult>): Promise<TResult> => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      if (!isRateLimitError(error) || attempt >= MAX_ATTEMPTS) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

// A seed makes thousands of calls against the app's per-minute limit; a rejected call never ran, so waiting and resending is safe.
export const rateLimitedClient = (client: RecordsClient): RecordsClient => ({
  query: ((...args: Parameters<RecordsClient['query']>) =>
    withRetry(() => client.query(...args))) as RecordsClient['query'],
  mutation: ((...args: Parameters<RecordsClient['mutation']>) =>
    withRetry(() => client.mutation(...args))) as RecordsClient['mutation'],
});
