import { PROOPCO_SYNC_ROUTE_PATH } from 'src/constants/proopco-sync.constant';

// The route is public; executeOneLogicFunction needs a user-bound token an API key lacks.
export const postRoute = async ({
  path,
  headers,
  body,
}: {
  path: string;
  headers: Record<string, string>;
  body: unknown;
}) => {
  const response = await fetch(`${process.env.TWENTY_API_URL}/s${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

  return { status: response.status, data: await response.json() };
};

export const postSyncRoute = (args: {
  headers: Record<string, string>;
  body: unknown;
}) => postRoute({ path: PROOPCO_SYNC_ROUTE_PATH, ...args });
