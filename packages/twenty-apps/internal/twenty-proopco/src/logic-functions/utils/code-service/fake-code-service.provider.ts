import { type CodeServiceProvider } from 'src/logic-functions/utils/code-service/code-service-provider.type';

// Stands in for proopco's code service until #39 lands.
export const fakeCodeServiceProvider: CodeServiceProvider = {
  activate: async ({ userProopcoId, capability }) => {
    const externalCodeId = `fake-${crypto.randomUUID()}`;

    return {
      success: true,
      externalCodeId,
      code: `${capability}-${userProopcoId}-${externalCodeId.slice(-6)}`.toUpperCase(),
    };
  },
};
