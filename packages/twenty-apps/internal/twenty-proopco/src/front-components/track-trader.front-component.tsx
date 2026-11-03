import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  Command,
  enqueueSnackbar,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';

import { TRACK_ROUTE_PATH } from 'src/constants/proopco-jobs.constant';
import { TRACK_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

type TrackResponse = { success: boolean; error?: string };

const TrackTraderCommand = () => {
  const [traderId] = useSelectedRecordIds();

  const track = async () => {
    try {
      const result = await new RestApiClient().post<TrackResponse>(
        `/s${TRACK_ROUTE_PATH}`,
        { traderId },
      );

      await enqueueSnackbar(
        result.success
          ? { message: 'Trader tracked', variant: 'success' }
          : { message: result.error ?? 'Track failed', variant: 'error' },
      );
    } catch {
      await enqueueSnackbar({ message: 'Track failed', variant: 'error' });
    }
  };

  return <Command execute={track} />;
};

export default defineFrontComponent({
  universalIdentifier: TRACK_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'track-trader-effect',
  description: 'Claims the selected Trader with a Pending Followup.',
  component: TrackTraderCommand,
  isHeadless: true,
});
