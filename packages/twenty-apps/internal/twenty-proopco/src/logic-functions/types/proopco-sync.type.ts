export type ProopcoSyncItemType = 'trader' | 'tradingAccount' | 'payment';

export type ProopcoSyncItem = {
  type: ProopcoSyncItemType;
  proopcoId: string;
  data: Record<string, unknown>;
};

export type ProopcoSyncItemResult = {
  type: ProopcoSyncItemType;
  proopcoId: string;
} & (
  | { status: 'created' | 'updated' | 'unchanged' }
  | { status: 'error'; reason: string; retryable: boolean }
);

export type ProopcoSyncResponse =
  | { success: true; results: ProopcoSyncItemResult[] }
  | { success: false; error: string };
