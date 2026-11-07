export type CodeServiceRequest = {
  userProopcoId: string;
  capability: string;
  params: unknown;
  expiresAt: string | null;
};

export type CodeServiceResult =
  | { success: true; externalCodeId: string; code: string }
  | { success: false; error: string };

export type CodeServiceProvider = {
  activate: (request: CodeServiceRequest) => Promise<CodeServiceResult>;
};
