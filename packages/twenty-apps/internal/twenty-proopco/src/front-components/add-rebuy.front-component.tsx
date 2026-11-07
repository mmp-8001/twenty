import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  Command,
  enqueueSnackbar,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';

import { ADD_REBUY_ROUTE_PATH } from 'src/constants/ownership.constant';
import { ADD_REBUY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

type AddResponse = { success: boolean; error?: string };

const AddRebuyCommand = () => {
  const [followupId] = useSelectedRecordIds();

  const add = async () => {
    try {
      const result = await new RestApiClient().post<AddResponse>(`/s${ADD_REBUY_ROUTE_PATH}`, {
        followupId,
      });

      await enqueueSnackbar(
        result.success
          ? { message: 'Added to your follow-up list', variant: 'success' }
          : { message: result.error ?? 'Could not add the user', variant: 'error' },
      );
    } catch {
      await enqueueSnackbar({ message: 'Could not add the user', variant: 'error' });
    }
  };

  return <Command execute={add} />;
};

export default defineFrontComponent({
  universalIdentifier: ADD_REBUY_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'add-rebuy',
  description: 'Adds the selected rebuy case to the caller follow-up list.',
  component: AddRebuyCommand,
  isHeadless: true,
});
