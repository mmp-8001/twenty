import { type CoreApiClient } from 'twenty-client-sdk/core';

import {
  type ProopcoSyncItem,
  type ProopcoSyncItemResult,
  type ProopcoSyncItemType,
} from 'src/logic-functions/types/proopco-sync.type';
import { buildSyncFields } from 'src/logic-functions/utils/build-sync-fields.util';
import {
  buildSelection,
  isSameValue,
} from 'src/logic-functions/utils/is-same-fields.util';
import { SyncItemError } from 'src/logic-functions/utils/sync-item-error.util';
import { isDefined } from 'src/utils/is-defined';

type SyncClient = Pick<CoreApiClient, 'query' | 'mutation'>;

const COLLECTION_BY_TYPE: Record<
  ProopcoSyncItemType,
  { plural: string; singular: string }
> = {
  user: { plural: 'people', singular: 'Person' },
  account: { plural: 'challengeAccounts', singular: 'ChallengeAccount' },
  payment: { plural: 'payments', singular: 'Payment' },
};

const REFERENCE_LABEL: Record<string, string> = {
  people: 'User',
  challengeAccounts: 'Account',
};

const findByProopcoId = async (
  client: SyncClient,
  collection: string,
  proopcoId: string,
  selection: Record<string, unknown>,
): Promise<Record<string, unknown> | undefined> => {
  const result = (await client.query({
    [collection]: {
      __args: { filter: { proopcoId: { eq: proopcoId } }, first: 1 },
      edges: { node: { id: true, ...selection } },
    },
  })) as unknown as Record<
    string,
    { edges?: { node?: Record<string, unknown> }[] } | undefined
  >;

  return result[collection]?.edges?.[0]?.node;
};

export const processProopcoSyncItem = async (
  client: SyncClient,
  item: ProopcoSyncItem,
): Promise<ProopcoSyncItemResult> => {
  const identity = { type: item.type, proopcoId: item.proopcoId };

  try {
    const { fields, references } = buildSyncFields(item.type, item.data);

    for (const [foreignKey, reference] of Object.entries(references)) {
      const referenced = await findByProopcoId(
        client,
        reference.collection,
        reference.proopcoId,
        {},
      );

      if (!isDefined(referenced)) {
        throw new SyncItemError(
          `${REFERENCE_LABEL[reference.collection]} ${reference.proopcoId} is not synced yet`,
          true,
        );
      }

      fields[foreignKey] = referenced.id;
    }

    const { plural, singular } = COLLECTION_BY_TYPE[item.type];
    const existing = await findByProopcoId(
      client,
      plural,
      item.proopcoId,
      buildSelection(fields),
    );

    if (!isDefined(existing)) {
      await client.mutation({
        [`create${singular}`]: {
          __args: {
            data: { ...fields, proopcoId: item.proopcoId },
            upsert: true,
          },
          id: true,
        },
      });

      return { ...identity, status: 'created' };
    }

    if (isSameValue(fields, existing)) {
      return { ...identity, status: 'unchanged' };
    }

    await client.mutation({
      [`update${singular}`]: {
        __args: { id: existing.id, data: fields },
        id: true,
      },
    });

    return { ...identity, status: 'updated' };
  } catch (error) {
    return {
      ...identity,
      status: 'error',
      reason: error instanceof Error ? error.message : String(error),
      // Anything that is not a validation failure may be transient.
      retryable: error instanceof SyncItemError ? error.retryable : true,
    };
  }
};
