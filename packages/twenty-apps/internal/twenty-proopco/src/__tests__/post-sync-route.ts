import { PROOPCO_SYNC_ROUTE_PATH } from 'src/constants/proopco-sync.constant';

// The route is public; executeOneLogicFunction needs a user-bound token an API key lacks.
export const postSyncRoute = async ({
  headers,
  body,
}: {
  headers: Record<string, string>;
  body: unknown;
}) => {
  const response = await fetch(
    `${process.env.TWENTY_API_URL}/s${PROOPCO_SYNC_ROUTE_PATH}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    },
  );

  return { status: response.status, data: await response.json() };
};
