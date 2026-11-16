import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  Command,
  enqueueSnackbar,
  msg,
  openCommandConfirmationModal,
  t,
} from 'twenty-sdk/front-component';

import { CLEAR_SHOWCASE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { showServerError } from 'src/front-components/utils/server-error.util';

const MESSAGES = {
  TECHNICAL_ADMIN_ONLY: msg('Only the technical admin can do this.'),
};

const ClearShowcase = () => {
  const execute = async () => {
    const confirmation = await openCommandConfirmationModal({
      title: t(msg('Remove all showcase data?')),
      subtitle: t(msg('Deletes every showcase contact, agent, campaign, code and the records made from them. Real data is not touched.')),
      confirmButtonText: t(msg('Clear showcase data')),
      confirmButtonAccent: 'danger',
    });

    if (confirmation !== 'confirm') {
      return;
    }

    try {
      await new RestApiClient().post('/s/showcase/clear', {});
      await enqueueSnackbar({ message: t(msg('Showcase data removed.')), variant: 'success' });
    } catch (error) {
      await showServerError(error, MESSAGES, t, msg('Clearing stopped. Run it again to finish.'));
    }
  };

  return <Command execute={execute} />;
};

export default defineFrontComponent({
  universalIdentifier: CLEAR_SHOWCASE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'clear-showcase',
  description: 'Clear showcase data: removes every tagged demo record.',
  component: ClearShowcase,
  isHeadless: true,
});
