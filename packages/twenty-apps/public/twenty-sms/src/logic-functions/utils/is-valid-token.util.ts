import { timingSafeEqual } from 'crypto';

export const isValidToken = (received: unknown, variable: string): boolean => {
  const expected = process.env[variable];

  if (typeof received !== 'string' || !expected) {
    return false;
  }

  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
};
