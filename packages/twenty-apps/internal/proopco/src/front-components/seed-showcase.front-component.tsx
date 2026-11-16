import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  Command,
  enqueueSnackbar,
  msg,
  openCommandConfirmationModal,
  t,
} from 'twenty-sdk/front-component';

import { SEED_SHOWCASE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { showServerError } from 'src/front-components/utils/server-error.util';

const MESSAGES = {
  TECHNICAL_ADMIN_ONLY: msg('Only the technical admin can do this.'),
};

const SeedShowcase = () => {
  const execute = async () => {
    const confirmation = await openCommandConfirmationModal({
      title: t(msg('Fill the CRM with showcase data?')),
      subtitle: t(
        msg('Adds about 30 tagged contacts with calls, deals, codes, purchases and incomes. Agents, the Report and lists show them until you run Clear showcase data.'),
      ),
      confirmButtonText: t(msg('Seed showcase data')),
    });

    if (confirmation !== 'confirm') {
      return;
    }

    await enqueueSnackbar({ message: t(msg('Seeding the showcase. This takes a few minutes.')), variant: 'info' });

    try {
      const result = (await new RestApiClient().post('/s/showcase/seed', {})) as { warnings?: string[] } | null;
      const warningCount = result?.warnings?.length ?? 0;

      await enqueueSnackbar({
        message:
          warningCount === 0
            ? t(msg('Showcase data is ready.'))
            : t(msg('Showcase data is ready, with {count} skipped steps. Run it again to retry them.'), { count: String(warningCount) }),
        variant: warningCount === 0 ? 'success' : 'info',
      });
    } catch (error) {
      await showServerError(error, MESSAGES, t, msg('The showcase seed stopped. Run it again to resume.'));
    }
  };

  return <Command execute={execute} />;
};

export default defineFrontComponent({
  universalIdentifier: SEED_SHOWCASE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'seed-showcase',
  description: 'Seed showcase data: fills every section with tagged demo records.',
  component: SeedShowcase,
  isHeadless: true,
});
