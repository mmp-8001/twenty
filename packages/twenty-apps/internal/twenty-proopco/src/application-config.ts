import { defineApplication, FieldType } from 'twenty-sdk/define';

import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
  REBUY_COOLDOWN_DAYS_VARIABLE_UNIVERSAL_IDENTIFIER,
  REBUY_FOLLOWUP_DAYS_VARIABLE_UNIVERSAL_IDENTIFIER,
  REBUY_START_HOURS_VARIABLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  author: 'Proopco',
  applicationVariables: {
    REBUY_START_HOURS: {
      universalIdentifier: REBUY_START_HOURS_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'Rebuy start (hours)',
      description: 'Hours a rebuy user waits for "Add to follow-up" before being released.',
      type: FieldType.NUMBER,
      isSecret: false,
      isRequired: true,
      value: 72,
    },
    REBUY_FOLLOWUP_DAYS: {
      universalIdentifier: REBUY_FOLLOWUP_DAYS_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'Rebuy follow-up (days)',
      description: 'Days a rebuy case runs after "Add to follow-up".',
      type: FieldType.NUMBER,
      isSecret: false,
      isRequired: true,
      value: 30,
    },
    REBUY_COOLDOWN_DAYS: {
      universalIdentifier: REBUY_COOLDOWN_DAYS_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'Rebuy cooldown (days)',
      description: 'Cooldown after a rebuy case expires.',
      type: FieldType.NUMBER,
      isSecret: false,
      isRequired: true,
      value: 30,
    },
  },
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
    CODE_SERVICE_PROVIDER: {
      description: 'How Offers are activated: "http" calls proopco, "fake" invents codes (demo). Unset refuses.',
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
