import { defineFrontComponent } from 'twenty-sdk/define';
import { Trans } from 'twenty-sdk/front-component';

import { Tag } from 'twenty-ui/primitives/data-display';

import { CALL_TIMELINE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

const CallTimelineEntry = () => (
  <Tag color="blue">
    <Trans>Call</Trans>
  </Tag>
);

export default defineFrontComponent({
  universalIdentifier: CALL_TIMELINE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'call-timeline-entry',
  description: 'Shows a Call on the User timeline.',
  component: CallTimelineEntry,
});
