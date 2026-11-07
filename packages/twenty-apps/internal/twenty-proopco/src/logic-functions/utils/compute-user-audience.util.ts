export type CampaignWindow = {
  status: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

export type AudiencePerson = {
  currentOwnerId: string | null;
  permanentlyFailedAt: string | null;
  cooldownUntil: string | null;
};

export const isCampaignActive = (
  { status, startsAt, endsAt }: CampaignWindow,
  now: Date,
): boolean =>
  status === 'ACTIVE' &&
  startsAt !== null &&
  new Date(startsAt) <= now &&
  (endsAt === null || new Date(endsAt) > now);

// Unowned, not permanently failed and not cooling down (DATA_MODEL 6).
export const isUserAvailable = (person: AudiencePerson, now: Date): boolean =>
  person.currentOwnerId === null &&
  person.permanentlyFailedAt === null &&
  (person.cooldownUntil === null || new Date(person.cooldownUntil) <= now);

// Sorted so the stored arrays compare equal when nothing changed.
export const computeUserAudience = ({
  person,
  activeCampaignIdsMatchingUser,
  adminIdsByCampaignId,
  now,
}: {
  person: AudiencePerson;
  activeCampaignIdsMatchingUser: string[];
  adminIdsByCampaignId: Record<string, string[]>;
  now: Date;
}): { visibleToMemberIds: string[]; candidateCampaignIds: string[] } => {
  if (!isUserAvailable(person, now)) {
    return { visibleToMemberIds: [], candidateCampaignIds: [] };
  }

  return {
    visibleToMemberIds: [
      ...new Set(
        activeCampaignIdsMatchingUser.flatMap(
          (campaignId) => adminIdsByCampaignId[campaignId] ?? [],
        ),
      ),
    ].sort(),
    candidateCampaignIds: [...activeCampaignIdsMatchingUser].sort(),
  };
};
