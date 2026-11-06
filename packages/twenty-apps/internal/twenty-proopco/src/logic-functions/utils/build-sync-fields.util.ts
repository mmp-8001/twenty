import { isBoolean, isNull, isNumber, isString } from '@sniptt/guards';

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
const isDateTime = (value: unknown): value is string =>
  isString(value) && !Number.isNaN(new Date(value).getTime());

const isDate = (value: unknown): value is string =>
  isString(value) &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(new Date(value).getTime());

const readString = (data: SyncItemData, key: string) =>
  readValue(data, key, isString, 'a string');
const readNumber = (data: SyncItemData, key: string) =>
  readValue(data, key, isFiniteNumber, 'a number');
const readDateTime = (data: SyncItemData, key: string) => {
  const value = readValue(data, key, isDateTime, 'an ISO date-time string');

  return isString(value) ? new Date(value).toISOString() : value;
};

const readBoolean = (data: SyncItemData, key: string) =>
  readValue(data, key, isBoolean, 'a boolean');
const readDate = (data: SyncItemData, key: string) =>
  readValue(data, key, isDate, 'a YYYY-MM-DD date');

const requireString = (data: SyncItemData, key: string): string => {
  const value = readString(data, key);

  return isString(value) ? value : fail(`${key} is required`);
};

const setDefined = (fields: SyncItemData, key: string, value: unknown) => {
  if (value !== undefined) {
    fields[key] = value;
  }
};

const requireNumber = (data: SyncItemData, key: string): number => {
  const value = readNumber(data, key);

  return isNumber(value) ? value : fail(`${key} is required and must be a number`);
};

const buildUserFields = (data: SyncItemData): BuiltSyncFields => {
  const fields: SyncItemData = {};
  const firstName = readString(data, 'firstName');
  const lastName = readString(data, 'lastName');
  const email = readString(data, 'email');
  const phoneNumber = readString(data, 'phoneNumber');
  const phoneCallingCode = readString(data, 'phoneCallingCode');

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

  setDefined(fields, 'signedUpAt', readDateTime(data, 'signedUpAt'));
  setDefined(fields, 'kycStatus', readString(data, 'kycStatus'));
  setDefined(fields, 'lastLoginAt', readDateTime(data, 'lastLoginAt'));
  setDefined(fields, 'birthday', readDate(data, 'birthday'));
  setDefined(fields, 'isReferral', readBoolean(data, 'isReferral'));
  setDefined(
    fields,
    'hasProfitWithdrawal',
    readBoolean(data, 'hasProfitWithdrawal'),
  );
  setDefined(fields, 'purchaseCount', readNumber(data, 'purchaseCount'));
  setDefined(fields, 'totalPaidUsdt', readNumber(data, 'totalPaidUsdt'));
  setDefined(fields, 'lastPurchaseAt', readDateTime(data, 'lastPurchaseAt'));
  setDefined(
    fields,
    'activeAccountCount',
    readNumber(data, 'activeAccountCount'),
  );
  setDefined(fields, 'currentStage', readString(data, 'currentStage'));

  return { fields, references: {} };
};

const buildAccountFields = (data: SyncItemData): BuiltSyncFields => {
  const fields: SyncItemData = {};

  setDefined(fields, 'status', readString(data, 'status'));
  setDefined(fields, 'phase', readString(data, 'phase'));
  setDefined(fields, 'failureReason', readString(data, 'failureReason'));

  return {
    fields,
    references: {
      userId: {
        collection: 'people',
        proopcoId: requireString(data, 'userProopcoId'),
      },
    },
  };
};

const buildPaymentFields = (data: SyncItemData): BuiltSyncFields => {
  const accountProopcoId = readString(data, 'accountProopcoId');
  const paidAt = readDateTime(data, 'paidAt');
  const references: BuiltSyncFields['references'] = {
    userId: {
      collection: 'people',
      proopcoId: requireString(data, 'userProopcoId'),
    },
  };
  // Proopco converts at settlement; the CRM never converts.
  const fields: SyncItemData = {
    amountToman: requireNumber(data, 'amountToman'),
    amountUsdt: requireNumber(data, 'amountUsdt'),
  };

  if (!isString(paidAt)) {
    fail('paidAt is required and must be an ISO date-time string');
  } else {
    fields.paidAt = paidAt;
  }

  if (isString(accountProopcoId)) {
    references.challengeAccountId = {
      collection: 'challengeAccounts',
      proopcoId: accountProopcoId,
    };
  }

  return { fields, references };
};

export const buildSyncFields = (
  type: ProopcoSyncItemType,
  data: SyncItemData,
): BuiltSyncFields => {
  switch (type) {
    case 'user':
      return buildUserFields(data);
    case 'account':
      return buildAccountFields(data);
    case 'payment':
      return buildPaymentFields(data);
  }
};
