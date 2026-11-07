import { defineFrontComponent } from 'twenty-sdk/define';
import { Trans } from 'twenty-sdk/front-component';

import { CALL_TIMELINE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

const CallTimelineEntry = () => <span>
    <Trans>Call</Trans>
  </span>;

export default defineFrontComponent({
  universalIdentifier: CALL_TIMELINE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'call-timeline-entry',
  description: 'Shows a Call on the User timeline.',
  component: CallTimelineEntry,
});
