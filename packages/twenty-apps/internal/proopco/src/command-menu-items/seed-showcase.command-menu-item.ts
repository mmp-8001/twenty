import { defineCommandMenuItem, targetObjectReadPermissions } from 'twenty-sdk/define';

import {
  SEED_SHOWCASE_COMMAND_UNIVERSAL_IDENTIFIER,
  SEED_SHOWCASE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// No Proopco role reads the event inbox, so that permission stands in for the technical admin; the server checks the role itself.
export default defineCommandMenuItem({
  universalIdentifier: SEED_SHOWCASE_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Seed showcase data',
  shortLabel: 'Seed showcase',
  availabilityType: 'GLOBAL',
  frontComponentUniversalIdentifier: SEED_SHOWCASE_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  conditionalAvailabilityExpression: targetObjectReadPermissions.platformEventInbox,
});
