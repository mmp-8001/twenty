import { isArray, isNonEmptyString } from '@sniptt/guards';

import { PROOPCO_SYNC_MAX_BATCH_SIZE } from 'src/constants/proopco-sync.constant';
import {
  PROOPCO_SYNC_ITEM_TYPES,
  type ProopcoSyncItem,
  type ProopcoSyncItemResult,
  type ProopcoSyncItemType,
} from 'src/logic-functions/types/proopco-sync.type';
import { isDemoKey } from 'src/utils/demo-data.util';
import { isPlainObject } from 'src/utils/is-plain-object';

export type ParsedSyncEntry =
  | { item: ProopcoSyncItem }
  | { result: ProopcoSyncItemResult };

const isItemType = (value: unknown): value is ProopcoSyncItemType =>
  PROOPCO_SYNC_ITEM_TYPES.some((itemType) => itemType === value);

// A malformed item becomes its own error result, so it never fails the batch.
const parseItem = (item: unknown): ParsedSyncEntry => {
  const record = isPlainObject(item) ? item : {};
  const type = isItemType(record.type) ? record.type : null;
  const proopcoId = isNonEmptyString(record.proopcoId) ? record.proopcoId : null;

  if (type === null || proopcoId === null || !isPlainObject(record.data)) {
    return {
      result: {
        type,
        proopcoId,
        status: 'error',
        reason: `An item needs type (${PROOPCO_SYNC_ITEM_TYPES.join(', ')}), a non-empty proopcoId and a data object`,
        retryable: false,
      },
    };
  }

  // The prefix marks what demo removal destroys, so a real item must never carry it.
  if (isDemoKey(proopcoId)) {
    return {
      result: { type, proopcoId, status: 'error', reason: 'The demo- proopcoId prefix is reserved', retryable: false },
    };
  }

  return { item: { type, proopcoId, data: record.data } };
};

export const parseProopcoSyncRequest = (
  body: unknown,
): { entries: ParsedSyncEntry[] } | { error: string } => {
  const items = isPlainObject(body) ? body.items : undefined;

  if (!isArray(items)) {
    return { error: 'Body must be { items: [...] }' };
  }

  if (items.length > PROOPCO_SYNC_MAX_BATCH_SIZE) {
    return {
      error: `A batch holds at most ${PROOPCO_SYNC_MAX_BATCH_SIZE} items`,
    };
  }

  return { entries: items.map(parseItem) };
};
