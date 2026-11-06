export const PROOPCO_SYNC_ITEM_TYPES = ['user', 'account', 'payment'] as const;

export type ProopcoSyncItemType = (typeof PROOPCO_SYNC_ITEM_TYPES)[number];

export type ProopcoSyncItem = {
  type: ProopcoSyncItemType;
  proopcoId: string;
  data: Record<string, unknown>;
};

// type and proopcoId are null only on a malformed item that did not carry them.
export type ProopcoSyncItemResult = {
  type: ProopcoSyncItemType | null;
  proopcoId: string | null;
} & (
  | { status: 'created' | 'updated' | 'unchanged' }
  | { status: 'error'; reason: string; retryable: boolean }
);

export type ProopcoSyncResponse =
  | { success: true; results: ProopcoSyncItemResult[] }
  | { success: false; error: string };
