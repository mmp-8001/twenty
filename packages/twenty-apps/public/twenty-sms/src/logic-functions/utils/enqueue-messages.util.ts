import { type CoreApiClient } from 'twenty-client-sdk/core';

import {
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/list-records.util';
import { normalizePhone } from 'src/logic-functions/utils/normalize-phone.util';
import { type EnqueueMessage } from 'src/logic-functions/utils/parse-enqueue-request.util';

export type EnqueueResult = { sourceRef: string; status: string };

export const enqueueMessages = async (
  client: RecordsClient,
  messages: EnqueueMessage[],
): Promise<EnqueueResult[]> => {
  const sourceRefs = [...new Set(messages.map(({ sourceRef }) => sourceRef))];
  const existing = await listRecords<{ sourceRef: string; status: string }>(
    client,
    'smsMessages',
    { sourceRef: { in: sourceRefs } },
    { sourceRef: true, status: true },
  );
  const statusBySourceRef = new Map(
    existing.map(({ sourceRef, status }) => [sourceRef, status.toLowerCase()]),
  );
  const phones = messages.flatMap(({ to }) => normalizePhone(to) ?? []);
  const optedOut = new Set(
    (
      await listRecords<{ phone: string }>(
        client,
        'smsOptOuts',
        { phone: { in: phones } },
        { phone: true },
      )
    ).map(({ phone }) => phone),
  );
  const toCreate: Record<string, unknown>[] = [];

  for (const { to, body, sourceRef } of messages) {
    if (statusBySourceRef.has(sourceRef)) {
      continue;
    }

    const phone = normalizePhone(to);
    const status = !phone
      ? 'invalid'
      : optedOut.has(phone)
        ? 'skipped_opt_out'
        : 'queued';

    statusBySourceRef.set(sourceRef, status);
    toCreate.push({
      to: phone ?? to,
      body,
      sourceRef,
      status: status.toUpperCase(),
    });
  }

  if (toCreate.length > 0) {
    await (client as Pick<CoreApiClient, 'mutation'>).mutation({
      createSmsMessages: { __args: { data: toCreate }, id: true },
    } as never);
  }

  return messages.map(({ sourceRef }) => ({
    sourceRef,
    status: statusBySourceRef.get(sourceRef)!,
  }));
};
