import { defineApplication, FieldType } from 'twenty-sdk/define';

import {
  API_TOKEN_VARIABLE_UNIVERSAL_IDENTIFIER,
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
  BASE_URL_VARIABLE_UNIVERSAL_IDENTIFIER,
  HMAC_SECRET_VARIABLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Variables are never removed or renamed once shipped; retire with isDeprecated.
export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  author: 'Proopco',
  applicationVariables: {
    PLATFORM_HMAC_SECRET: {
      universalIdentifier: HMAC_SECRET_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'Platform HMAC secret',
      description: 'Shared secret that signs the events the platform sends.',
      type: FieldType.TEXT,
      isSecret: true,
    },
    PLATFORM_API_TOKEN: {
      universalIdentifier: API_TOKEN_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'Platform API token',
      description: 'Bearer token for the platform endpoints the CRM calls.',
      type: FieldType.TEXT,
      isSecret: true,
    },
    PLATFORM_BASE_URL: {
      universalIdentifier: BASE_URL_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'Platform base URL',
      description: 'Base URL of the platform API, without a trailing slash.',
      type: FieldType.TEXT,
    },
  },
});
