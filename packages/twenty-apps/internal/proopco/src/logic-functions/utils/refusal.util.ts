import { Response } from 'twenty-sdk/logic-function';

import { type RefusalCode } from 'src/constants/refusal-codes.constant';

// Stable `code` for front components to translate; `message` stays English.
export class Refusal extends Error {
  constructor(
    readonly status: number,
    readonly code: RefusalCode,
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

// Turns a thrown Refusal into its error response; other errors still propagate.
export const withRefusals = async <TResult>(run: () => Promise<TResult>) => {
  try {
    return await run();
  } catch (error) {
    return refusalResponse(error);
  }
};
