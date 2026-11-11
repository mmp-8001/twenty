import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  Command,
  enqueueSnackbar,
  msg,
  openCommandConfirmationModal,
  t,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';

import { DEACTIVATE_DISCOUNT_CODE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readServerError } from 'src/front-components/utils/server-error.util';

const ERROR_MESSAGES: Record<string, ReturnType<typeof msg>> = {
  FULL_ADMIN_ONLY: msg('Only a Full Admin can do this.'),
  ALREADY_DEACTIVATED: msg('This code is already deactivated.'),
};

const DeactivateDiscountCode = () => {
  const recordIds = useSelectedRecordIds();

  const execute = async () => {
    const confirmation = await openCommandConfirmationModal({
      title: t(msg('Deactivate this code?')),
      subtitle: t(msg('It stops working for every user it was activated for. This cannot be undone.')),
      confirmButtonText: t(msg('Deactivate')),
      confirmButtonAccent: 'danger',
    });

    if (confirmation !== 'confirm') {
      return;
    }

    try {
      await new RestApiClient().post('/s/codes/deactivate', { codeId: recordIds[0] });
      await enqueueSnackbar({ message: t(msg('Code deactivated.')), variant: 'success' });
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
  universalIdentifier: DEACTIVATE_DISCOUNT_CODE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'deactivate-discount-code',
  description: 'Full Admin: deactivates the selected code on the platform and for every user.',
  component: DeactivateDiscountCode,
  isHeadless: true,
});
