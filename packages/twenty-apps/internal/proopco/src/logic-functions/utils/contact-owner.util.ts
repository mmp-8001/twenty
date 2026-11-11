import {
  updateRecordsWhere,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';

// Collections that carry a contactOwner copy; every owner change rewrites all four (spec 5).
const OWNER_COPIES = [
  { plural: 'Calls', contactField: 'contactId' },
  { plural: 'Opportunities', contactField: 'pointOfContactId' },
  { plural: 'CodeActivations', contactField: 'contactId' },
  { plural: 'Purchases', contactField: 'contactId' },
];

// Filtering on the previous owner keeps a rerun from overwriting a later owner change.
export const rewriteContactOwner = async (
  client: RecordsClient,
  personId: string,
  fromAgentId: string | null,
  to: { agentId: string; memberId: string | null } | null,
) => {
  for (const { plural, contactField } of OWNER_COPIES) {
    await updateRecordsWhere(
      client,
      plural,
      {
        and: [
          { [contactField]: { eq: personId } },
          { contactOwnerId: fromAgentId === null ? { is: 'NULL' } : { eq: fromAgentId } },
        ],
      },
      { contactOwnerId: to?.agentId ?? null, contactOwnerMemberId: to?.memberId ?? null },
    );
  }
};
