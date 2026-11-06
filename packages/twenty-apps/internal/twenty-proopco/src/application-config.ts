import { defineApplication } from 'twenty-sdk/define';

import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  author: 'Proopco',
  serverVariables: {
    PROOPCO_SYNC_TOKEN: {
      description:
        'Shared secret proopco sends in the x-proopco-sync-token header.',
      isSecret: true,
      isRequired: false,
    },
    SMS_ENQUEUE_URL: {
      description: 'Public URL of the twenty-sms enqueue route (.../s/sms/enqueue).',
      isRequired: false,
    },
    SMS_ENQUEUE_TOKEN: {
      description: "The twenty-sms app's ENQUEUE_TOKEN.",
      isSecret: true,
      isRequired: false,
    },
    PROOPCO_API_BASE_URL: {
      description: 'Base URL of the proopco API used for discount codes.',
      isRequired: false,
    },
    PROOPCO_API_KEY: {
      description: 'Bearer key for the proopco API. The only write back to proopco.',
      isSecret: true,
      isRequired: false,
    },
  },
});
