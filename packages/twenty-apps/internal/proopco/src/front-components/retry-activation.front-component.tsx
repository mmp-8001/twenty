import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  Command,
  enqueueSnackbar,
  msg,
  t,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';

import { RETRY_ACTIVATION_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { showServerError } from 'src/front-components/utils/server-error.util';

const ERROR_MESSAGES: Record<string, ReturnType<typeof msg>> = {
  NOT_ALLOWED: msg('Only the owner, the activating agent or an admin can do this.'),
  CODE_DEACTIVATED: msg('This code was deactivated.'),
  CODE_EXPIRED: msg('This code has expired.'),
  CONTACT_DO_NOT_CONTACT: msg('This contact is marked Do not contact.'),
  NOT_FAILED: msg('Only a failed activation can be retried.'),
};

const RetryActivation = () => {
  const recordIds = useSelectedRecordIds();

  const execute = async () => {
    try {
      const result = await new RestApiClient().post<{ status?: string; smsStatus?: string }>('/s/activations/retry', {
        activationId: recordIds[0],
      });

      await enqueueSnackbar(
        result.status === 'FAILED' || result.smsStatus === 'FAILED'
          ? { message: t(msg('The activation failed again. Try again later.')), variant: 'error' }
          : { message: t(msg('Done.')), variant: 'success' },
      );
    } catch (error) {
      await showServerError(error, ERROR_MESSAGES, t, msg('Something went wrong.'));
    }
  };

  return <Command execute={execute} />;
};

export default defineFrontComponent({
  universalIdentifier: RETRY_ACTIVATION_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'retry-activation',
  description: 'Retries the selected failed code activation.',
  component: RetryActivation,
  isHeadless: true,
});
