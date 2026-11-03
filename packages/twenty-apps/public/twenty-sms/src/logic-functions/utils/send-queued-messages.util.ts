import {
  updateRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/list-records.util';
import { type SmsProvider } from 'src/providers/sms-provider.type';

// ponytail: overlapping runs could double-send; a SENDING status would close it.
export const sendQueuedMessages = async ({
  client,
  provider,
  from,
  limit,
}: {
  client: RecordsClient;
  provider: SmsProvider;
  from: string;
  limit: number;
}): Promise<{ sent: number; failed: number }> => {
  const result = (await client.query({
    smsMessages: {
      __args: {
        filter: { status: { eq: 'QUEUED' } },
        orderBy: [{ createdAt: 'AscNullsFirst' }],
        first: limit,
      },
      edges: { node: { id: true, to: true, body: true } },
    },
  } as never)) as unknown as {
    smsMessages: {
      edges: { node: { id: string; to: string; body: string } }[];
    };
  };
  let sent = 0;
  let failed = 0;

  for (const { node } of result.smsMessages.edges) {
    try {
      const { providerMessageId } = await provider.send({
        from,
        to: node.to,
        body: node.body,
      });

      await updateRecord(client, 'SmsMessage', node.id, {
        status: 'SENT',
        providerMessageId,
        sentAt: new Date().toISOString(),
      });
      sent += 1;
    } catch (error) {
      await updateRecord(client, 'SmsMessage', node.id, {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      });
      failed += 1;
    }
  }

  return { sent, failed };
};
