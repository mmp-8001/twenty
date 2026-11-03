import { MAX_ENQUEUE_BATCH_SIZE } from 'src/constants/sms.constant';

export type EnqueueMessage = { to: string; body: string; sourceRef: string };

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

export const parseEnqueueRequest = (
  body: unknown,
): { messages: EnqueueMessage[] } | { error: string } => {
  const messages = (body as { messages?: unknown } | null)?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return { error: 'messages must be a non-empty array' };
  }

  if (messages.length > MAX_ENQUEUE_BATCH_SIZE) {
    return { error: `At most ${MAX_ENQUEUE_BATCH_SIZE} messages per request` };
  }

  for (const [index, message] of messages.entries()) {
    if (
      typeof message?.to !== 'string' ||
      !isNonEmptyString(message?.body) ||
      !isNonEmptyString(message?.sourceRef)
    ) {
      return {
        error: `messages[${index}] needs a string to, a body and a sourceRef`,
      };
    }
  }

  return { messages };
};
