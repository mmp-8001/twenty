import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  Command,
  enqueueSnackbar,
  msg,
  t,
  useSelectedRecordIds,
} from 'twenty-sdk/front-component';

import { type RefusalCode } from 'src/constants/refusal-codes.constant';
import { ADD_TO_FOLLOW_UP_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { showServerError } from 'src/front-components/utils/server-error.util';

type ClaimResponse = { campaignName: string | null; kind: 'CAMPAIGN' | 'REBUY' };

const ERROR_MESSAGES: Partial<Record<RefusalCode, ReturnType<typeof msg>>> = {
  CLAIM_LOST: msg("This user is in another agent's follow-ups."),
  NOT_ELIGIBLE: msg('This contact is not in your lists.'),
  NO_ACTIVE_AGENT: msg('This user has no active agent.'),
  AGENT_FROZEN: msg('This agent is frozen.'),
  FOLLOW_UP_ENDED: msg('This follow-up has ended.'),
  CLAIM_FAILED: msg('Could not add this contact. Try again.'),
};

const AddToFollowUp = () => {
  const recordIds = useSelectedRecordIds();

  const execute = async () => {
    if (recordIds.length !== 1) {
      await enqueueSnackbar({ message: t(msg('Select one contact.')), variant: 'error' });

      return;
    }

    try {
      const result = await new RestApiClient().post<ClaimResponse>('/s/contacts/claim', {
        personId: recordIds[0],
      });

      await enqueueSnackbar({
        message: result.campaignName
          ? t(msg('Added to your follow-ups from {campaign}.'), { campaign: result.campaignName })
          : t(msg('Added to your follow-ups.')),
        variant: 'success',
      });
    } catch (error) {
      await showServerError(error, ERROR_MESSAGES, t, msg('Something went wrong.'));
    }
  };

  return <Command execute={execute} />;
};

export default defineFrontComponent({
  universalIdentifier: ADD_TO_FOLLOW_UP_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'add-to-follow-up',
  description: 'Takes the selected free contact into the caller follow-ups, or moves an owned rebuy contact in.',
  component: AddToFollowUp,
  isHeadless: true,
});
