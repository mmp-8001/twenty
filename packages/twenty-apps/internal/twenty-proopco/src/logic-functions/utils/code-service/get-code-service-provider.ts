import { type CodeServiceProvider } from 'src/logic-functions/utils/code-service/code-service-provider.type';
import { fakeCodeServiceProvider } from 'src/logic-functions/utils/code-service/fake-code-service.provider';
import { httpCodeServiceProvider } from 'src/logic-functions/utils/code-service/http-code-service.provider';

// Unset means not configured: a silent fake would hand users codes that do not exist.
export const getCodeServiceProvider = (name = process.env.CODE_SERVICE_PROVIDER): CodeServiceProvider => {
  switch (name) {
    case 'fake':
      return fakeCodeServiceProvider;
    case 'http':
      return httpCodeServiceProvider;
    default:
      throw new Error(`Unknown code service provider "${name ?? ''}": set CODE_SERVICE_PROVIDER to fake or http`);
  }
};
