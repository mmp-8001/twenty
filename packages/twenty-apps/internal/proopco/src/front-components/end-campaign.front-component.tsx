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

import { END_CAMPAIGN_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { readServerError } from 'src/front-components/utils/server-error.util';

const EndCampaign = () => {
  const recordIds = useSelectedRecordIds();

  const execute = async () => {
    const confirmation = await openCommandConfirmationModal({
      title: t(msg('End this campaign now?')),
      subtitle: t(msg('Its contacts stop being offered to agents right away.')),
      confirmButtonText: t(msg('End now')),
      confirmButtonAccent: 'danger',
    });

    if (confirmation !== 'confirm') {
      return;
    }

    try {
      await new RestApiClient().post('/s/campaigns/end', { campaignId: recordIds[0] });
      await enqueueSnackbar({ message: t(msg('Campaign ended.')), variant: 'success' });
    } catch (error) {
      await enqueueSnackbar({
        message: readServerError(error).message ?? t(msg('Something went wrong.')),
        variant: 'error',
      });
    }
  };

  return <Command execute={execute} />;
};

export default defineFrontComponent({
  universalIdentifier: END_CAMPAIGN_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'end-campaign',
  description: 'End now: ends the selected campaign.',
  component: EndCampaign,
  isHeadless: true,
});
