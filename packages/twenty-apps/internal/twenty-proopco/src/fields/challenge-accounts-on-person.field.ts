import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  CHALLENGE_ACCOUNTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  CHALLENGE_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  USER_ON_CHALLENGE_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: CHALLENGE_ACCOUNTS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'challengeAccounts',
  label: 'Challenge Accounts',
  description: 'Challenge Accounts this User owns.',
  icon: 'IconChartCandle',
  isNullable: true,
  isUIEditable: false,
  relationTargetObjectMetadataUniversalIdentifier:
    CHALLENGE_ACCOUNT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    USER_ON_CHALLENGE_ACCOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
