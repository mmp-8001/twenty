import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import { Command, enqueueSnackbar, msg, t } from 'twenty-sdk/front-component';

import { SEED_DEMO_DATA_ROUTE_PATH } from 'src/constants/demo-data.constant';
import { SEED_DEMO_DATA_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { serverErrorLabel } from 'src/utils/front-labels.util';

const SERVER_ERRORS = [
  msg('Demo data needs at least one active Sales Admin or Supervisor'),
];

const SeedDemoDataCommand = () => {
  const run = async () => {
    try {
      const result = await new RestApiClient().post<{ success: boolean; error?: string }>(
        `/s${SEED_DEMO_DATA_ROUTE_PATH}`,
        {},
      );

      await enqueueSnackbar(
        result.success
          ? { message: t('Demo data created'), variant: 'success' }
          : { message: serverErrorLabel(result.error, t('Seed demo data failed'), SERVER_ERRORS, t), variant: 'error' },
      );
    } catch {
      await enqueueSnackbar({ message: t('Seed demo data failed'), variant: 'error' });
    }
  };

  return <Command execute={run} />;
};

export default defineFrontComponent({
  universalIdentifier: SEED_DEMO_DATA_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'seed-demo-data-effect',
  description: 'Creates demo records across the proopco objects.',
  component: SeedDemoDataCommand,
  isHeadless: true,
});
