import { STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';

import { PERSON_CALL_URGENCY_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-call-urgency.field';
import { PERSON_NEXT_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-next-call-at.field';
import { PERSON_PLAN_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER } from 'src/fields/person-plan-progress.field';

// Binds a relation filter to whoever is looking at the view.
export const CURRENT_MEMBER_FILTER_VALUE = {
  isCurrentWorkspaceMemberSelected: true,
  selectedRecordIds: [],
};

export const followUpColumns = (
  identifiers: [string, string, string, string],
) =>
  [
    [identifiers[0], STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.fields.name.universalIdentifier, 220],
    [identifiers[1], PERSON_NEXT_CALL_AT_FIELD_UNIVERSAL_IDENTIFIER, 180],
    [identifiers[2], PERSON_CALL_URGENCY_FIELD_UNIVERSAL_IDENTIFIER, 120],
    [identifiers[3], PERSON_PLAN_PROGRESS_FIELD_UNIVERSAL_IDENTIFIER, 220],
  ].map(([universalIdentifier, fieldMetadataUniversalIdentifier, size], position) => ({
    universalIdentifier: universalIdentifier as string,
    fieldMetadataUniversalIdentifier: fieldMetadataUniversalIdentifier as string,
    position,
    isVisible: true,
    size: size as number,
  }));
