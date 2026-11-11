import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  Command,
  enqueueSnackbar,
  msg,
  t,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';

import { RESEND_SMS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readServerError } from 'src/front-components/utils/server-error.util';

const ERROR_MESSAGES: Record<string, ReturnType<typeof msg>> = {
  NOT_ALLOWED: msg('Only the owner, the activating agent or an admin can do this.'),
  CODE_DEACTIVATED: msg('This code was deactivated.'),
  CODE_EXPIRED: msg('This code has expired.'),
  CONTACT_DO_NOT_CONTACT: msg('This contact is marked Do not contact.'),
  NOT_ACTIVE: msg('An SMS is sent only for an active code.'),
};

const ResendSms = () => {
  const recordIds = useSelectedRecordIds();

  const execute = async () => {
    try {
      const result = await new RestApiClient().post<{ status?: string; smsStatus?: string }>('/s/activations/resend-sms', {
        activationId: recordIds[0],
      });

      await enqueueSnackbar(
        result.status === 'FAILED' || result.smsStatus === 'FAILED'
          ? { message: t(msg('The SMS failed again. Try again later.')), variant: 'error' }
          : { message: t(msg('Done.')), variant: 'success' },
      );
    } catch (error) {
      const { code, message } = readServerError(error);
      const descriptor = code === null ? undefined : ERROR_MESSAGES[code];

      await enqueueSnackbar({
        message: descriptor ? t(descriptor) : (message ?? t(msg('Something went wrong.'))),
        variant: 'error',
      });
    }
  };

  return <Command execute={execute} />;
};

export default defineFrontComponent({
  universalIdentifier: RESEND_SMS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'resend-sms',
  description: 'Sends the code SMS again for the selected active activation.',
  component: ResendSms,
  isHeadless: true,
});
