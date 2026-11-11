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

import { REACTIVATE_AGENT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { showServerError } from 'src/front-components/utils/server-error.util';

const ERROR_MESSAGES: Record<string, ReturnType<typeof msg>> = {
  STAFF_ONLY: msg('Only a Supervisor or Full Admin can do this.'),
  FULL_ADMIN_ONLY: msg('Only a Full Admin can do this.'),
  SELF_FREEZE: msg('You cannot freeze yourself.'),
  ALREADY_FROZEN: msg('This agent is already frozen.'),
  NOT_FROZEN: msg('This agent is not frozen.'),
  AGENT_INACTIVE: msg('This agent is not active.'),
  ALREADY_INACTIVE: msg('This agent is already deactivated.'),
  ALREADY_ACTIVE: msg('This agent is already active.'),
};

const ReactivateAgent = () => {
  const recordIds = useSelectedRecordIds();

  const execute = async () => {
    const confirmation = await openCommandConfirmationModal({
      title: t(msg('Reactivate this agent?')),
      subtitle: t(msg('Then set their role back in Settings.')),
      confirmButtonText: t(msg('Reactivate')),
      confirmButtonAccent: 'blue',
    });

    if (confirmation !== 'confirm') {
      return;
    }

    try {
      await new RestApiClient().post('/s/agents/reactivate', { agentId: recordIds[0] });
      await enqueueSnackbar({ message: t(msg('Agent reactivated.')), variant: 'success' });
    } catch (error) {
      await showServerError(error, ERROR_MESSAGES, t, msg('Something went wrong.'));
    }
  };

  return <Command execute={execute} />;
};

export default defineFrontComponent({
  universalIdentifier: REACTIVATE_AGENT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'reactivate-agent',
  description: 'Reactivate agent: acts on the selected agent.',
  component: ReactivateAgent,
  isHeadless: true,
});
