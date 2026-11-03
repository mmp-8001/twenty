import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  Command,
  enqueueSnackbar,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';

import { SEND_CAMPAIGN_ROUTE_PATH } from 'src/constants/campaign.constant';
import { SEND_CAMPAIGN_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

type SendResponse = {
  success: boolean;
  error?: string;
  recipientCount?: number;
};

const SendCampaignCommand = () => {
  const [campaignId] = useSelectedRecordIds();

  const send = async () => {
    try {
      const result = await new RestApiClient().post<SendResponse>(
        `/s${SEND_CAMPAIGN_ROUTE_PATH}`,
        { campaignId },
      );

      await enqueueSnackbar(
        result.success
          ? {
              message: `Campaign queued for ${result.recipientCount} recipients`,
              variant: 'success',
            }
          : { message: result.error ?? 'Send failed', variant: 'error' },
      );
    } catch {
      await enqueueSnackbar({ message: 'Send failed', variant: 'error' });
    }
  };

  return <Command execute={send} />;
};

export default defineFrontComponent({
  universalIdentifier: SEND_CAMPAIGN_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'send-campaign-effect',
  description: 'Queues the selected Campaign through the SMS app.',
  component: SendCampaignCommand,
  isHeadless: true,
});
