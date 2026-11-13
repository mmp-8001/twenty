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

import { type RefusalCode } from 'src/constants/refusal-codes.constant';
import { UNFREEZE_AGENT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { showServerError } from 'src/front-components/utils/server-error.util';

const ERROR_MESSAGES: Partial<Record<RefusalCode, ReturnType<typeof msg>>> = {
  STAFF_ONLY: msg('Only a Supervisor or Full Admin can do this.'),
  FULL_ADMIN_ONLY: msg('Only a Full Admin can do this.'),
  SELF_FREEZE: msg('You cannot freeze yourself.'),
  ALREADY_FROZEN: msg('This agent is already frozen.'),
  NOT_FROZEN: msg('This agent is not frozen.'),
  AGENT_INACTIVE: msg('This agent is not active.'),
  ALREADY_INACTIVE: msg('This agent is already deactivated.'),
  ALREADY_ACTIVE: msg('This agent is already active.'),
};

const UnfreezeAgent = () => {
  const recordIds = useSelectedRecordIds();

  const execute = async () => {
    const confirmation = await openCommandConfirmationModal({
      title: t(msg('Unfreeze this agent?')),
      subtitle: t(msg('Their deadlines resume with the frozen time added.')),
      confirmButtonText: t(msg('Unfreeze')),
      confirmButtonAccent: 'blue',
    });

    if (confirmation !== 'confirm') {
      return;
    }

    try {
      await new RestApiClient().post('/s/agents/unfreeze', { agentId: recordIds[0] });
      await enqueueSnackbar({ message: t(msg('Agent unfrozen.')), variant: 'success' });
    } catch (error) {
      await showServerError(error, ERROR_MESSAGES, t, msg('Something went wrong.'));
    }
  };

  return <Command execute={execute} />;
};

export default defineFrontComponent({
  universalIdentifier: UNFREEZE_AGENT_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'unfreeze-agent',
  description: 'Unfreeze agent: acts on the selected agent.',
  component: UnfreezeAgent,
  isHeadless: true,
});
