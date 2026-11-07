import { RestApiClient } from 'twenty-client-sdk/rest';

export const postRoute = <TResponse,>(path: string, body: unknown) =>
  new RestApiClient().post<TResponse>(`/s${path}`, body);
