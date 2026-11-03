import { type RecordsClient, listRecords } from 'src/logic-functions/utils/list-records.util';

type GiftResult = { success: true } | { success: false; error: string };

// Proopco's real contract is not known here; this is the minimal assumed shape.
const readRejection = async (response: Response): Promise<string> => {
  const text = await response.text();

  try {
    const parsed = JSON.parse(text) as { message?: string; error?: string };

    return parsed.message ?? parsed.error ?? text;
  } catch {
    return text || `Proopco answered ${response.status}`;
  }
};

export const giftDiscount = async ({
  client,
  personId,
  code,
}: {
  client: RecordsClient;
  personId: string;
  code: string;
}): Promise<GiftResult> => {
  const baseUrl = process.env.PROOPCO_API_BASE_URL;
  const apiKey = process.env.PROOPCO_API_KEY;

  if (!baseUrl || !apiKey) {
    return {
      success: false,
      error:
        'The proopco API is not configured: set PROOPCO_API_BASE_URL and PROOPCO_API_KEY in Settings > Applications > twenty-proopco',
    };
  }

  const [trader] = await listRecords<{ proopcoId?: string | null }>(
    client,
    'people',
    { id: { eq: personId } },
    { proopcoId: true },
  );

  if (!trader?.proopcoId) {
    return { success: false, error: 'This person is not a synced Trader' };
  }

  const response = await fetch(
    `${baseUrl.replace(/\/+$/, '')}/crm/gift-discount`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ userId: trader.proopcoId, code }),
    },
  );

  return response.ok
    ? { success: true }
    : { success: false, error: await readRejection(response) };
};
