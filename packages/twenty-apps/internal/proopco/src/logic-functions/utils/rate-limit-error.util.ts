import { isNonEmptyArray } from 'twenty-shared/utils';

type GraphqlErrorLike = { extensions?: { code?: unknown; subCode?: unknown } };

// A 429 surfaces as an HTTP error ("Too Many Requests: …") or as a GraphQL error coded RATE_LIMITED.
export const isRateLimitError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.message.startsWith('Too Many Requests')) {
    return true;
  }

  const graphqlErrors = (error as Error & { errors?: GraphqlErrorLike[] }).errors;

  return (
    isNonEmptyArray(graphqlErrors) &&
    graphqlErrors.some(({ extensions }) => extensions?.code === 'RATE_LIMITED' || extensions?.subCode === 'RATE_LIMITED')
  );
};
