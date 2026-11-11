import { Response } from 'twenty-sdk/logic-function';

// Stable `code` for front components to translate; `message` stays English.
export class Refusal extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const refusalResponse = (error: unknown) => {
  if (error instanceof Refusal) {
    return new Response(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  throw error;
};
