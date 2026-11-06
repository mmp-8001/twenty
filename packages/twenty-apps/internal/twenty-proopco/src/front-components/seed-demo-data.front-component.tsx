import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import { Command, enqueueSnackbar } from 'twenty-sdk/front-component';

import { SEED_DEMO_DATA_ROUTE_PATH } from 'src/constants/demo-data.constant';
import { SEED_DEMO_DATA_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

const SeedDemoDataCommand = () => {
  const run = async () => {
    try {
      const result = await new RestApiClient().post<{
        success: boolean;
        error?: string;
      }>(`/s${SEED_DEMO_DATA_ROUTE_PATH}`, {});

      await enqueueSnackbar(
        result.success
          ? { message: 'Demo data created', variant: 'success' }
          : {
              message: result.error ?? 'Seed demo data failed',
              variant: 'error',
            },
      );
    } catch {
      await enqueueSnackbar({
        message: 'Seed demo data failed',
        variant: 'error',
      });
    }
  };

  return <Command execute={run} />;
};

export default defineFrontComponent({
  universalIdentifier: SEED_DEMO_DATA_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'seed-demo-data-effect',
  description: 'Creates demo records in every proopco object.',
  component: SeedDemoDataCommand,
  isHeadless: true,
});
