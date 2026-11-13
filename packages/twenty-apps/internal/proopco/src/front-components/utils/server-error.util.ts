import { isString } from '@sniptt/guards';
import { RestApiClientError } from 'twenty-client-sdk/rest';
import { closeSidePanel, enqueueSnackbar, unmountFrontComponent, type msg } from 'twenty-sdk/front-component';

import { isRefusalCode, type RefusalCode } from 'src/constants/refusal-codes.constant';

export type ServerError = { code: string | null; message: string | null };

// Routes answer refusals as { error: { code, message } }; anything else is an unexpected failure.
export const readServerError = (error: unknown): ServerError => {
  const body = error instanceof RestApiClientError ? error.body : undefined;
  const detail = (body as { error?: { code?: unknown; message?: unknown } } | undefined)?.error;

  return {
    code: isString(detail?.code) ? detail.code : null,
    message: isString(detail?.message) ? detail.message : null,
  };
};

type MessageDescriptor = ReturnType<typeof msg>;
type Translate = (descriptor: MessageDescriptor) => string;

// The descriptors stay in each component file: message extraction only scans *.front-component.tsx.
export const serverErrorMessage = (
  error: unknown,
  descriptors: Partial<Record<RefusalCode, MessageDescriptor>>,
  translate: Translate,
  fallback: MessageDescriptor,
) => {
  const { code, message } = readServerError(error);
  const descriptor = code !== null && isRefusalCode(code) ? descriptors[code] : undefined;

  return descriptor ? translate(descriptor) : (message ?? translate(fallback));
};

export const showServerError = (
  error: unknown,
  descriptors: Partial<Record<RefusalCode, MessageDescriptor>>,
  translate: Translate,
  fallback: MessageDescriptor,
) =>
  enqueueSnackbar({ message: serverErrorMessage(error, descriptors, translate, fallback), variant: 'error' });

export const closeFormPanel = () => {
  unmountFrontComponent();
  closeSidePanel();
};
