import { type CodeServiceProvider } from 'src/logic-functions/utils/code-service/code-service-provider.type';

// Proopco's real contract is not known here; this is the assumed shape (DATA_MODEL section 10, item 2).
const readRejection = async (response: Response): Promise<string> => {
  const text = await response.text();

  try {
    const parsed = JSON.parse(text) as { message?: string; error?: string };

    return parsed.message ?? parsed.error ?? text;
  } catch {
    return text || `Proopco answered ${response.status}`;
  }
};

export const httpCodeServiceProvider: CodeServiceProvider = {
  activate: async (request) => {
    const baseUrl = process.env.PROOPCO_API_BASE_URL;
    const apiKey = process.env.PROOPCO_API_KEY;

    if (!baseUrl || !apiKey) {
      return {
        success: false,
        error: 'The proopco API is not configured: set PROOPCO_API_BASE_URL and PROOPCO_API_KEY',
      };
    }

    try {
      const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/crm/offer-codes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        return { success: false, error: await readRejection(response) };
      }

      const { id, code } = (await response.json()) as { id?: string | number; code?: string };

      return id !== undefined && code
        ? { success: true, externalCodeId: String(id), code }
        : { success: false, error: 'Proopco returned no code' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
};
