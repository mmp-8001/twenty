import { createHmac, timingSafeEqual } from 'crypto';
import { isNonEmptyString } from '@sniptt/guards';

import { SIGNATURE_MAX_SKEW_MS } from 'src/constants/platform-events.constant';

const SIGNATURE_PREFIX = 'sha256=';

export const signPlatformBody = (
  secret: string,
  timestampSeconds: string,
  rawBody: string,
): string =>
  SIGNATURE_PREFIX +
  createHmac('sha256', secret)
    .update(`${timestampSeconds}.${rawBody}`)
    .digest('hex');

type VerifyInput = {
  secret: string | undefined;
  timestamp: string | undefined;
  signature: string | undefined;
  rawBody: string | undefined;
  now: Date;
};

export const verifyPlatformSignature = ({
  secret,
  timestamp,
  signature,
  rawBody,
  now,
}: VerifyInput): boolean => {
  if (
    !isNonEmptyString(secret) ||
    !isNonEmptyString(timestamp) ||
    !isNonEmptyString(signature) ||
    rawBody === undefined
  ) {
    return false;
  }

  const timestampMs = Number(timestamp) * 1000;

  if (
    !/^\d+$/.test(timestamp) ||
    Math.abs(now.getTime() - timestampMs) > SIGNATURE_MAX_SKEW_MS
  ) {
    return false;
  }

  const expected = Buffer.from(signPlatformBody(secret, timestamp, rawBody));
  const received = Buffer.from(signature);

  return expected.length === received.length && timingSafeEqual(expected, received);
};
