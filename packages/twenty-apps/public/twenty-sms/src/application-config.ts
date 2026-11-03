import { defineApplication, FieldType } from 'twenty-sdk/define';

import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  serverVariables: {
    SMS_PROVIDER: {
      description: 'Provider that sends the messages. FAKE sends nothing.',
      type: FieldType.SELECT,
      options: [
        { label: 'Fake (sends nothing)', value: 'FAKE' },
        { label: 'HTTP gateway', value: 'HTTP_GATEWAY' },
      ],
      isRequired: true,
    },
    SMS_PROVIDER_URL: {
      description: 'HTTP gateway endpoint that accepts { from, to, body }.',
      isRequired: false,
    },
    SMS_PROVIDER_API_KEY: {
      description: 'Bearer key for the provider. Not used by FAKE.',
      isSecret: true,
      isRequired: false,
    },
    SMS_SENDER: {
      description: 'Sender id or number shown to recipients.',
      isRequired: true,
    },
    RATE_PER_MINUTE: {
      description: 'Most messages the sender sends per minute.',
      type: FieldType.NUMBER,
      isRequired: true,
    },
    ENQUEUE_TOKEN: {
      description: 'Secret callers send in the x-sms-enqueue-token header.',
      isSecret: true,
      isRequired: true,
    },
    SMS_CALLBACK_TOKEN: {
      description:
        'Secret the provider sends in the x-sms-callback-token header on delivery reports.',
      isSecret: true,
      isRequired: true,
    },
  },
});
