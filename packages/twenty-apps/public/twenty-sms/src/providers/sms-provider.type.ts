export type SmsProvider = {
  send: (message: {
    from: string;
    to: string;
    body: string;
  }) => Promise<{ providerMessageId: string }>;
};
