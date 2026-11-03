import { isArray, isBoolean, isNull, isNumber, isString } from '@sniptt/guards';

import { PAYMENT_KINDS } from 'src/constants/proopco-sync.constant';
import { type ProopcoSyncItemType } from 'src/logic-functions/types/proopco-sync.type';
import { SyncItemError } from 'src/logic-functions/utils/sync-item-error.util';

type SyncItemData = Record<string, unknown>;

export type BuiltSyncFields = {
  fields: Record<string, unknown>;
  // Foreign key field on the record -> proopcoId of the record it points to.
  references: Record<string, { collection: string; proopcoId: string }>;
};

const fail = (message: string): never => {
  throw new SyncItemError(message, false);
};

// undefined when the key is absent, so a partial item leaves other fields alone.
const readValue = <TValue>(
  data: SyncItemData,
  key: string,
  isValid: (value: unknown) => value is TValue,
  expected: string,
): TValue | null | undefined => {
  if (!(key in data)) {
    return undefined;
  }

  const value = data[key];

  if (isNull(value)) {
    return null;
  }

  return isValid(value) ? value : fail(`${key} must be ${expected}`);
};

const isFiniteNumber = (value: unknown): value is number =>
  isNumber(value) && Number.isFinite(value);
const isStringArray = (value: unknown): value is string[] =>
  isArray(value) && value.every(isString);
const isDateTime = (value: unknown): value is string =>
  isString(value) && !Number.isNaN(new Date(value).getTime());

const readString = (data: SyncItemData, key: string) =>
  readValue(data, key, isString, 'a string');
const readNumber = (data: SyncItemData, key: string) =>
  readValue(data, key, isFiniteNumber, 'a number');
const readDateTime = (data: SyncItemData, key: string) => {
  const value = readValue(data, key, isDateTime, 'an ISO date-time string');

  return isString(value) ? new Date(value).toISOString() : value;
};

const requireString = (data: SyncItemData, key: string): string => {
  const value = readString(data, key);

  return isString(value) ? value : fail(`${key} is required`);
};

const setDefined = (fields: SyncItemData, key: string, value: unknown) => {
  if (value !== undefined) {
    fields[key] = value;
  }
};

const toMicros = (usd: number) => Math.round(usd * 1_000_000);

const buildTraderFields = (data: SyncItemData): BuiltSyncFields => {
  const fields: SyncItemData = {};
  const references: BuiltSyncFields['references'] = {};
  const firstName = readString(data, 'firstName');
  const lastName = readString(data, 'lastName');
  const email = readString(data, 'email');
  const phoneNumber = readString(data, 'phoneNumber');
  const phoneCallingCode = readString(data, 'phoneCallingCode');
  const totalSpentUsd = readNumber(data, 'totalSpentUsd');
  const referredByProopcoId = readString(data, 'referredByProopcoId');

  if (firstName !== undefined || lastName !== undefined) {
    fields.name = {
      ...(firstName !== undefined && { firstName: firstName ?? '' }),
      ...(lastName !== undefined && { lastName: lastName ?? '' }),
    };
  }

  if (isString(email)) {
    fields.emails = { primaryEmail: email };
  }

  if (isString(phoneNumber)) {
    fields.phones = {
      primaryPhoneNumber: phoneNumber,
      ...(isString(phoneCallingCode) && {
        primaryPhoneCallingCode: phoneCallingCode,
      }),
    };
  }

  setDefined(fields, 'purchaseCount', readNumber(data, 'purchaseCount'));
  setDefined(fields, 'lastPurchaseAt', readDateTime(data, 'lastPurchaseAt'));
  setDefined(fields, 'isVip', readValue(data, 'isVip', isBoolean, 'a boolean'));
  setDefined(fields, 'source', readString(data, 'source'));
  setDefined(
    fields,
    'labels',
    readValue(data, 'labels', isStringArray, 'an array of strings'),
  );

  if (isFiniteNumber(totalSpentUsd)) {
    fields.totalSpent = {
      amountMicros: toMicros(totalSpentUsd),
      currencyCode: 'USD',
    };
  }

  if (isString(referredByProopcoId)) {
    references.referredById = {
      collection: 'people',
      proopcoId: referredByProopcoId,
    };
  } else if (isNull(referredByProopcoId)) {
    fields.referredById = null;
  }

  return { fields, references };
};

const buildTradingAccountFields = (data: SyncItemData): BuiltSyncFields => {
  const fields: SyncItemData = {};

  setDefined(fields, 'status', readString(data, 'status'));
  setDefined(fields, 'failureReason', readString(data, 'failureReason'));
  setDefined(fields, 'phase', readString(data, 'phase'));

  return {
    fields,
    references: {
      traderId: {
        collection: 'people',
        proopcoId: requireString(data, 'traderProopcoId'),
      },
    },
  };
};

const buildPaymentFields = (data: SyncItemData): BuiltSyncFields => {
  const amountUsd = readNumber(data, 'amountUsd');
  const kind = readString(data, 'kind');
  const tradingAccountProopcoId = readString(data, 'tradingAccountProopcoId');
  const fields: SyncItemData = {};
  const references: BuiltSyncFields['references'] = {
    traderId: {
      collection: 'people',
      proopcoId: requireString(data, 'traderProopcoId'),
    },
  };

  if (!isFiniteNumber(amountUsd)) {
    fail('amountUsd is required and must be a number');
  } else {
    fields.amount = { amountMicros: toMicros(amountUsd), currencyCode: 'USD' };
  }

  if (!PAYMENT_KINDS.some((allowedKind) => allowedKind === kind)) {
    fail(`kind must be one of ${PAYMENT_KINDS.join(', ')}`);
  }

  // select option values are UPPER_SNAKE_CASE; the wire format stays lowercase
  fields.kind = String(kind).toUpperCase();
  setDefined(fields, 'paidAt', readDateTime(data, 'paidAt'));

  if (isString(tradingAccountProopcoId)) {
    references.tradingAccountId = {
      collection: 'tradingAccounts',
      proopcoId: tradingAccountProopcoId,
    };
  }

  return { fields, references };
};

export const buildSyncFields = (
  type: ProopcoSyncItemType,
  data: SyncItemData,
): BuiltSyncFields => {
  switch (type) {
    case 'trader':
      return buildTraderFields(data);
    case 'tradingAccount':
      return buildTradingAccountFields(data);
    case 'payment':
      return buildPaymentFields(data);
  }
};
