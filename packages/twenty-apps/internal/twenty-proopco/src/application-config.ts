import { defineApplication, FieldType } from 'twenty-sdk/define';

import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
  COMMISSION_BASIS_VARIABLE_UNIVERSAL_IDENTIFIER,
  COMMISSION_SCOPE_VARIABLE_UNIVERSAL_IDENTIFIER,
  INSTALLMENT_REMAINING_EARNS_VARIABLE_UNIVERSAL_IDENTIFIER,
  POOL_DAYS_VARIABLE_UNIVERSAL_IDENTIFIER,
  RETRY_WINDOW_DAYS_VARIABLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  author: 'Proopco',
  applicationVariables: {
    RETRY_WINDOW_DAYS: {
      universalIdentifier: RETRY_WINDOW_DAYS_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'Retry window (days)',
      description:
        'Days a Retry Pending Followup stays with its owner before entering the Pool.',
      type: FieldType.NUMBER,
      isSecret: false,
      isRequired: true,
      value: 7,
    },
    POOL_DAYS: {
      universalIdentifier: POOL_DAYS_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'Pool days',
      description:
        'Days a Followup stays in the Pool before it expires as not followed up.',
      type: FieldType.NUMBER,
      isSecret: false,
      isRequired: true,
      value: 7,
    },
    COMMISSION_BASIS: {
      universalIdentifier: COMMISSION_BASIS_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'Commission basis',
      description: 'Amount a Commission rate is applied to.',
      type: FieldType.SELECT,
      isSecret: false,
      isRequired: true,
      options: [
        { label: 'Paid amount', value: 'paid_amount' },
        { label: 'List price', value: 'list_price' },
      ],
      value: 'paid_amount',
    },
    INSTALLMENT_REMAINING_EARNS: {
      universalIdentifier:
        INSTALLMENT_REMAINING_EARNS_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'Remaining installment earns Commission',
      description:
        'Whether the remaining installment payment of a commissioned purchase earns its own Commission.',
      type: FieldType.BOOLEAN,
      isSecret: false,
      isRequired: true,
      value: true,
    },
    COMMISSION_SCOPE: {
      universalIdentifier: COMMISSION_SCOPE_VARIABLE_UNIVERSAL_IDENTIFIER,
      label: 'Commission scope',
      description: 'Which purchases during an active Followup earn Commission.',
      type: FieldType.SELECT,
      isSecret: false,
      isRequired: true,
      options: [
        { label: 'First purchase only', value: 'first_purchase' },
        {
          label: 'All purchases in window',
          value: 'all_purchases_in_window',
        },
      ],
      value: 'first_purchase',
    },
  },
  serverVariables: {
    PROOPCO_SYNC_TOKEN: {
      description:
        'Shared secret proopco sends in the x-proopco-sync-token header.',
      isSecret: true,
      isRequired: true,
    },
  },
});
