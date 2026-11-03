import { PROOPCO_SYNC_MAX_BATCH_SIZE } from 'src/constants/proopco-sync.constant';
import { type ProopcoSyncItem } from 'src/logic-functions/types/proopco-sync.type';

const ITEM_TYPES = ['trader', 'tradingAccount', 'payment'];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseProopcoSyncRequest = (
  body: unknown,
): { items: ProopcoSyncItem[] } | { error: string } => {
  const items = isPlainObject(body) ? body.items : undefined;

  if (!Array.isArray(items)) {
    return { error: 'Body must be { items: [...] }' };
  }

  if (items.length > PROOPCO_SYNC_MAX_BATCH_SIZE) {
    return {
      error: `A batch holds at most ${PROOPCO_SYNC_MAX_BATCH_SIZE} items`,
    };
  }

  const parsedItems: ProopcoSyncItem[] = [];

  for (const [index, item] of items.entries()) {
    if (
      !isPlainObject(item) ||
      typeof item.type !== 'string' ||
      !ITEM_TYPES.includes(item.type) ||
      typeof item.proopcoId !== 'string' ||
      item.proopcoId === '' ||
      !isPlainObject(item.data)
    ) {
      return {
        error: `Item ${index} needs type (trader, tradingAccount or payment), a non-empty proopcoId and a data object`,
      };
    }

    parsedItems.push(item as ProopcoSyncItem);
  }

  return { items: parsedItems };
};
