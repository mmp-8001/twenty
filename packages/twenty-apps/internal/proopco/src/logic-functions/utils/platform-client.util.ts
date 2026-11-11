import { isNonEmptyString } from '@sniptt/guards';

export const PLATFORM_TIMEOUT_MS = 10_000;

export class PlatformError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
  }
}

export type PlatformCapability = 'discount' | 'reset' | 'two_step_payment';

export type PlatformClient = {
  createCode: (
    input: { code: string; capability: PlatformCapability; expiresAt: string },
    idempotencyKey: string,
  ) => Promise<{ platformCodeId: string }>;
  deactivateCode: (platformCodeId: string, idempotencyKey: string) => Promise<void>;
  activateCode: (platformCodeId: string, platformUserId: string, idempotencyKey: string) => Promise<void>;
  sendSms: (platformUserId: string, text: string, idempotencyKey: string) => Promise<void>;
};

type PlatformClientConfig = {
  baseUrl?: string;
  token?: string;
  timeoutMs?: number;
};

// Contract section 4: bearer token, one idempotency key per call, short timeout, never retried here.
export const createPlatformClient = (config: PlatformClientConfig = {}): PlatformClient => {
  const post = async <TBody>(path: string, idempotencyKey: string, body?: unknown): Promise<TBody> => {
    // Read per call: app variables can change while the function stays warm.
    const baseUrl = config.baseUrl ?? process.env.PLATFORM_BASE_URL;
    const token = config.token ?? process.env.PLATFORM_API_TOKEN;

    if (!isNonEmptyString(baseUrl) || !isNonEmptyString(token)) {
      throw new PlatformError('NOT_CONFIGURED', 'The platform connection is not configured.');
    }

    let response: Response;

    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          'idempotency-key': idempotencyKey,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(config.timeoutMs ?? PLATFORM_TIMEOUT_MS),
      });
    } catch (error) {
      throw error instanceof Error && error.name === 'TimeoutError'
        ? new PlatformError('TIMEOUT', 'The platform did not answer in time.')
        : new PlatformError('NETWORK', 'The platform could not be reached.');
    }

    const payload = (await response.json().catch(() => null)) as
      | (TBody & { error?: { code?: string; message?: string } })
      | null;

    if (!response.ok) {
      throw new PlatformError(
        payload?.error?.code ?? 'PLATFORM_ERROR',
        payload?.error?.message ?? `The platform answered ${response.status}.`,
        response.status,
      );
    }

    return payload as TBody;
  };

  return {
    createCode: (input, idempotencyKey) =>
      post<{ platformCodeId: string }>('/codes', idempotencyKey, input),
    deactivateCode: async (platformCodeId, idempotencyKey) => {
      await post(`/codes/${encodeURIComponent(platformCodeId)}/deactivate`, idempotencyKey);
    },
    activateCode: async (platformCodeId, platformUserId, idempotencyKey) => {
      await post(`/codes/${encodeURIComponent(platformCodeId)}/activations`, idempotencyKey, { platformUserId });
    },
    sendSms: async (platformUserId, text, idempotencyKey) => {
      await post('/sms', idempotencyKey, { platformUserId, text });
    },
  };
};

export const platformErrorMessage = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).slice(0, 500);
