import { createServer, type IncomingMessage, type Server } from 'http';

export type StubRequest<TBody> = {
  url: string;
  headers: IncomingMessage['headers'];
  body: TBody;
};

export type StubResponse = { status: number; body: unknown };

// External HTTP (proopco, the SMS app) is the only thing the suite stubs.
export const startStubServer = async <TBody>(
  respond: (request: StubRequest<TBody>) => StubResponse,
): Promise<{ url: string; requests: StubRequest<TBody>[]; stop: () => Promise<void> }> => {
  const requests: StubRequest<TBody>[] = [];
  const server: Server = createServer((incoming, outgoing) => {
    let raw = '';

    incoming.on('data', (chunk) => (raw += chunk));
    incoming.on('end', () => {
      const request: StubRequest<TBody> = {
        url: incoming.url ?? '',
        headers: incoming.headers,
        body: raw ? JSON.parse(raw) : undefined,
      };

      requests.push(request);

      const { status, body } = respond(request);

      outgoing.writeHead(status, { 'content-type': 'application/json' });
      outgoing.end(JSON.stringify(body));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  const { port } = server.address() as { port: number };

  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    stop: () => new Promise((resolve) => server.close(() => resolve())),
  };
};
