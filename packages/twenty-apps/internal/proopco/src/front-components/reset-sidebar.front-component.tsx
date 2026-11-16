import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import { Command, enqueueSnackbar, msg, t } from 'twenty-sdk/front-component';

import { RESET_SIDEBAR_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { showServerError } from 'src/front-components/utils/server-error.util';

const ResetSidebar = () => {
  const execute = async () => {
    try {
      await new RestApiClient().post('/s/sidebar/sync', { force: true });

      // The sandbox cannot reload the page, so the user does it.
      await enqueueSnackbar({ message: t(msg('Your sidebar is rebuilt. Refresh the page to see it.')), variant: 'success' });
    } catch (error) {
      await showServerError(error, {}, t, msg('Could not rebuild your sidebar. Try again.'));
    }
  };

  return <Command execute={execute} />;
};

export default defineFrontComponent({
  universalIdentifier: RESET_SIDEBAR_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'reset-sidebar',
  description: 'Reset my sidebar: rebuilds the caller\'s personal sidebar from their role.',
  component: ResetSidebar,
  isHeadless: true,
});
