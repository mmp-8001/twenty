import {
  SMS_ENQUEUE_BATCH_SIZE,
  SMS_ENQUEUE_TOKEN_HEADER,
} from 'src/constants/campaign.constant';
import {
  listRecords,
  updateRecord,
  type RecordsClient,
} from 'src/logic-functions/utils/list-records.util';
import { readSegmentFilter } from 'src/logic-functions/utils/read-segment-filter.util';

type SendCampaignResult =
  | { success: true; recipientCount: number }
  | { success: false; error: string };

type CampaignNode = { segmentViewId: string; message: string };
type PersonNode = {
  phones?: {
    primaryPhoneNumber?: string | null;
    primaryPhoneCallingCode?: string | null;
  } | null;
};
type EnqueueMessage = { to: string; body: string; sourceRef: string };

export const toE164 = (phones: PersonNode['phones']): string | undefined => {
  const number = phones?.primaryPhoneNumber?.trim();

  if (!number) {
    return undefined;
  }

  if (number.startsWith('+')) {
    return number;
  }

  // The SMS app rejects what is still not E.164 as invalid.
  return `${phones?.primaryPhoneCallingCode ?? ''}${number.replace(/\D/g, '')}`;
};

const postBatch = async (messages: EnqueueMessage[]) => {
  const response = await fetch(process.env.SMS_ENQUEUE_URL!, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      [SMS_ENQUEUE_TOKEN_HEADER]: process.env.SMS_ENQUEUE_TOKEN!,
    },
    body: JSON.stringify({ messages }),
  });
  const result = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
  };

  if (!response.ok || !result.success) {
    throw new Error(`SMS enqueue failed: ${result.error ?? response.status}`);
  }
};

export const sendCampaign = async ({
  client,
  campaignId,
}: {
  client: RecordsClient;
  campaignId: string;
}): Promise<SendCampaignResult> => {
  if (!process.env.SMS_ENQUEUE_URL || !process.env.SMS_ENQUEUE_TOKEN) {
    return {
      success: false,
      error:
        'SMS is not configured: set SMS_ENQUEUE_URL and SMS_ENQUEUE_TOKEN in Settings > Applications > twenty-proopco',
    };
  }

  const [campaign] = await listRecords<CampaignNode>(
    client,
    'campaigns',
    { id: { eq: campaignId } },
    { segmentViewId: true, message: true },
  );

  if (!campaign) {
    return { success: false, error: 'Campaign not found' };
  }

  // The claim makes a second click, or a second manager, a no-op.
  const claimed = (await client.mutation({
    updateCampaigns: {
      __args: {
        filter: { id: { eq: campaignId }, status: { eq: 'DRAFT' } },
        data: { status: 'SENDING' },
      },
      id: true,
    },
  } as never)) as unknown as { updateCampaigns?: { id: string }[] };

  if (!claimed.updateCampaigns?.length) {
    return { success: false, error: 'Campaign is already sending or sent' };
  }

  try {
    const people = await listRecords<PersonNode & { id: string }>(
      client,
      'people',
      await readSegmentFilter(campaign.segmentViewId),
      { phones: { primaryPhoneNumber: true, primaryPhoneCallingCode: true } },
    );
    const messages = people.flatMap((person) => {
      const to = toE164(person.phones);

      return to
        ? [{ to, body: campaign.message, sourceRef: `campaign:${campaignId}:person:${person.id}` }]
        : [];
    });

    if (messages.length === 0) {
      await updateRecord(client, 'Campaign', campaignId, { status: 'DRAFT' });

      return { success: false, error: 'No recipients match this segment' };
    }

    for (let start = 0; start < messages.length; start += SMS_ENQUEUE_BATCH_SIZE) {
      await postBatch(messages.slice(start, start + SMS_ENQUEUE_BATCH_SIZE));
    }

    await updateRecord(client, 'Campaign', campaignId, {
      status: 'SENT',
      sentAt: new Date().toISOString(),
      recipientCount: messages.length,
    });

    return { success: true, recipientCount: messages.length };
  } catch (error) {
    // Back to Draft: resending is safe because the SMS app dedups on sourceRef.
    await updateRecord(client, 'Campaign', campaignId, { status: 'DRAFT' });

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
};
