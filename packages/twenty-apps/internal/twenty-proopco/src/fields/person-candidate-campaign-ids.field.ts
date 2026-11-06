import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { PERSON_CANDIDATE_CAMPAIGN_IDS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: PERSON_CANDIDATE_CAMPAIGN_IDS_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.ARRAY,
  name: 'candidateCampaignIds',
  label: 'Candidate campaigns',
  description: 'Ids of the active campaigns this unowned User is available in. Recomputed by the app.',
  icon: 'IconSpeakerphone',
  isNullable: true,
  isUIEditable: false,
});
