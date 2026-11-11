import { isNonEmptyString, isNull, isNumber, isString } from '@sniptt/guards';
import { isDefined } from 'twenty-sdk/utils';

import { type PlatformEvent } from 'src/logic-functions/utils/parse-platform-envelope.util';
import {
  createRecord,
  listRecords,
  updateRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

const REGISTRATION_SOURCES = ['website', 'telegram', 'zoomit'];
const KYC_STATUSES = ['none', 'pending', 'confirmed', 'rejected'];
const CURRENT_STAGES = ['step_1', 'step_2', 'funded'];

const readString = (data: Record<string, unknown>, key: string) => {
  const value = data[key];

  return isString(value) ? value : null;
};

const readDate = (data: Record<string, unknown>, key: string) => {
  const value = readString(data, key);

  if (value === null) {
    return null;
  }

  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${key} is not a date`);
  }

  return new Date(value).toISOString();
};

const readNumber = (data: Record<string, unknown>, key: string) => {
  const value = data[key];

  if (!isNumber(value) || !Number.isFinite(value)) {
    throw new Error(`${key} must be a number`);
  }

  return value;
};

const readMoney = (data: Record<string, unknown>, key: string) => {
  const value = Number(data[key]);

  if (!Number.isFinite(value)) {
    throw new Error(`${key} must be a decimal string`);
  }

  return Math.round(value * 100) / 100;
};

const readBoolean = (data: Record<string, unknown>, key: string) => {
  const value = data[key];

  if (typeof value !== 'boolean') {
    throw new Error(`${key} must be a boolean`);
  }

  return value;
};

const readEnum = (
  data: Record<string, unknown>,
  key: string,
  allowed: string[],
) => {
  const value = data[key];

  if (isNull(value)) {
    return null;
  }

  if (!isString(value) || !allowed.includes(value)) {
    throw new Error(`${key} must be one of ${allowed.join(', ')}`);
  }

  return value.toUpperCase();
};

// shortcut: only Iranian numbers are split into calling code and number; others keep the whole E.164 string, upgrade with libphonenumber if the platform opens to other countries.
const toPhones = (phone: string | null) => {
  if (!isNonEmptyString(phone)) {
    return { primaryPhoneNumber: '', primaryPhoneCountryCode: '', primaryPhoneCallingCode: '' };
  }

  return phone.startsWith('+98')
    ? { primaryPhoneNumber: phone.slice(3), primaryPhoneCountryCode: 'IR', primaryPhoneCallingCode: '+98' }
    : { primaryPhoneNumber: phone, primaryPhoneCountryCode: '', primaryPhoneCallingCode: '' };
};

export const buildPersonFields = (data: Record<string, unknown>) => {
  const fields: Record<string, unknown> = {
    name: {
      firstName: readString(data, 'firstName') ?? '',
      lastName: readString(data, 'lastName') ?? '',
    },
    emails: { primaryEmail: readString(data, 'email') ?? '' },
    phones: toPhones(readString(data, 'phone')),
    platformUpdatedAt: readDate(data, 'updatedAt'),
    signupAt: readDate(data, 'signupAt'),
    hasPhone: readBoolean(data, 'hasPhone'),
    country: readString(data, 'country'),
    registrationSource: readEnum(data, 'registrationSource', REGISTRATION_SOURCES),
    kycStatus: readEnum(data, 'kycStatus', KYC_STATUSES),
    birthDate: readString(data, 'birthDate'),
    activeAccountCount: readNumber(data, 'activeAccountCount'),
    purchaseCount: readNumber(data, 'purchaseCount'),
    lastPurchaseAt: readDate(data, 'lastPurchaseAt'),
    totalPaidUsdt: readMoney(data, 'totalPaidUsdt'),
    currentStage: readEnum(data, 'currentStage', CURRENT_STAGES),
    lastChallengeFailedAt: readDate(data, 'lastChallengeFailedAt'),
    failedChallengeCount: readNumber(data, 'failedChallengeCount'),
    hasProfitWithdrawal: readBoolean(data, 'hasProfitWithdrawal'),
    isReferred: readBoolean(data, 'isReferred'),
  };

  // lastLoginAt travels only in the nightly snapshot: absent means unchanged.
  if ('lastLoginAt' in data) {
    fields.lastLoginAt = readDate(data, 'lastLoginAt');
  }

  return fields;
};

export const isStaleSnapshot = (
  storedUpdatedAt: string | null | undefined,
  incomingUpdatedAt: string,
) =>
  isDefined(storedUpdatedAt) &&
  new Date(storedUpdatedAt).getTime() > new Date(incomingUpdatedAt).getTime();

export const upsertContact = async (
  client: RecordsClient,
  event: PlatformEvent,
): Promise<void> => {
  const platformUserId = event.data.platformUserId;

  if (!isNonEmptyString(platformUserId)) {
    throw new Error('platformUserId is required');
  }

  const fields = buildPersonFields(event.data);
  const [existing] = await listRecords<{
    id: string;
    platformUpdatedAt: string | null;
  }>(client, 'people', { platformUserId: { eq: platformUserId } }, { platformUpdatedAt: true }, 1);

  if (!isDefined(existing)) {
    await createRecord(client, 'Person', { ...fields, platformUserId });

    return;
  }

  if (!isStaleSnapshot(existing.platformUpdatedAt, fields.platformUpdatedAt as string)) {
    await updateRecord(client, 'Person', existing.id, fields);
  }
};
