import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import { Command, enqueueSnackbar } from 'twenty-sdk/front-component';

import { REMOVE_DEMO_DATA_ROUTE_PATH } from 'src/constants/demo-data.constant';
import { REMOVE_DEMO_DATA_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

const RemoveDemoDataCommand = () => {
  const run = async () => {
    try {
      const result = await new RestApiClient().post<{
        success: boolean;
        error?: string;
      }>(`/s${REMOVE_DEMO_DATA_ROUTE_PATH}`, {});

      await enqueueSnackbar(
        result.success
          ? { message: 'Demo data removed', variant: 'success' }
          : {
              message: result.error ?? 'Remove demo data failed',
              variant: 'error',
            },
      );
    } catch {
      await enqueueSnackbar({
        message: 'Remove demo data failed',
        variant: 'error',
      });
    }
  };

  return <Command execute={run} />;
};

export default defineFrontComponent({
  universalIdentifier: REMOVE_DEMO_DATA_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'remove-demo-data-effect',
  description: 'Deletes the demo records.',
  component: RemoveDemoDataCommand,
  isHeadless: true,
});
