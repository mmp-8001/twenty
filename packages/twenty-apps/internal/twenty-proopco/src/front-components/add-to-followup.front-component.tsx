import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import { Command, enqueueSnackbar, msg, t, useSelectedRecordIds } from 'twenty-sdk/front-component';

import { ADD_TO_FOLLOWUP_ROUTE_PATH } from 'src/constants/ownership.constant';
import { ADD_TO_FOLLOWUP_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { serverErrorLabel } from 'src/utils/front-labels.util';

type AddResponse = { success: boolean; error?: string };

const SERVER_ERRORS = [
  msg('Sign in required'),
  msg('Your account is frozen or deactivated'),
  msg('This user is not available'),
  msg("This user is in another agent's follow-up list"),
];

const AddToFollowupCommand = () => {
  const [personId] = useSelectedRecordIds();

  const add = async () => {
    try {
      const result = await new RestApiClient().post<AddResponse>(
        `/s${ADD_TO_FOLLOWUP_ROUTE_PATH}`,
        { personId },
      );

      // The server's message is shown as it came: for a taken user it says nothing more.
      await enqueueSnackbar(
        result.success
          ? { message: t('Added to your follow-up list'), variant: 'success' }
          : { message: serverErrorLabel(result.error, t('Could not add the user'), SERVER_ERRORS, t), variant: 'error' },
      );
    } catch {
      await enqueueSnackbar({ message: t('Could not add the user'), variant: 'error' });
    }
  };

  return <Command execute={add} />;
};

export default defineFrontComponent({
  universalIdentifier: ADD_TO_FOLLOWUP_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'add-to-followup',
  description: 'Adds the selected User to the caller follow-up list.',
  component: AddToFollowupCommand,
  isHeadless: true,
});
