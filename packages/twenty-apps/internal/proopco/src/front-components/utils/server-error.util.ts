import { RestApiClientError } from 'twenty-client-sdk/rest';

export type ServerError = { code: string | null; message: string | null };

// Routes answer refusals as { error: { code, message } }; anything else is an unexpected failure.
export const readServerError = (error: unknown): ServerError => {
  const body = error instanceof RestApiClientError ? error.body : undefined;
  const detail = (body as { error?: { code?: unknown; message?: unknown } } | undefined)?.error;

  return {
    code: typeof detail?.code === 'string' ? detail.code : null,
    message: typeof detail?.message === 'string' ? detail.message : null,
  };
};
