import { isNonEmptyString, isObject } from '@sniptt/guards';

import {
  MAX_EVENTS_PER_REQUEST,
  PLATFORM_EVENT_TYPES,
  SUPPORTED_SCHEMA_MAJOR,
  type PlatformEventType,
} from 'src/constants/platform-events.constant';

export type PlatformEvent = {
  eventId: string;
  type: PlatformEventType;
  schemaVersion: string;
  occurredAt: string;
  data: Record<string, unknown>;
};

export type ParsedEnvelope =
  | { ok: true; events: PlatformEvent[] }
  | { ok: false; status: 400 | 422; code: string; message: string };

const isIsoDate = (value: unknown): value is string =>
  isNonEmptyString(value) && !Number.isNaN(Date.parse(value));

export const parsePlatformEnvelope = (rawBody: string): ParsedEnvelope => {
  let body: unknown;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return { ok: false, status: 400, code: 'BAD_BODY', message: 'Body is not JSON' };
  }

  const events = isObject(body) ? (body as { events?: unknown }).events : undefined;

  if (!Array.isArray(events) || events.length < 1 || events.length > MAX_EVENTS_PER_REQUEST) {
    return {
      ok: false,
      status: 400,
      code: 'BAD_BODY',
      message: `events must hold 1 to ${MAX_EVENTS_PER_REQUEST} items`,
    };
  }

  const parsed: PlatformEvent[] = [];

  for (const candidate of events) {
    const event = candidate as Partial<PlatformEvent> | null;

    if (
      !isObject(event) ||
      !isNonEmptyString(event.eventId) ||
      !PLATFORM_EVENT_TYPES.includes(event.type as PlatformEventType) ||
      !isIsoDate(event.occurredAt) ||
      !isObject(event.data) ||
      !isNonEmptyString(event.schemaVersion) ||
      !/^\d+\.\d+$/.test(event.schemaVersion)
    ) {
      return {
        ok: false,
        status: 400,
        code: 'BAD_EVENT',
        message: 'Each event needs eventId, a known type, schemaVersion, occurredAt and data',
      };
    }

    if (Number(event.schemaVersion.split('.')[0]) !== SUPPORTED_SCHEMA_MAJOR) {
      return {
        ok: false,
        status: 422,
        code: 'UNSUPPORTED_SCHEMA_VERSION',
        message: `Unsupported schemaVersion ${event.schemaVersion}`,
      };
    }

    parsed.push(event as PlatformEvent);
  }

  return { ok: true, events: parsed };
};
