import { LONG_FREEZE_DAYS } from 'src/constants/admin-management.constant';
import { listRecords, type RecordsClient } from 'src/logic-functions/utils/list-records.util';
import { type AdminRoleKey } from 'src/utils/admin-permissions.util';
import { daysFrozen } from 'src/utils/freeze-time.util';

export type AdminRow = {
  memberId: string;
  name: string;
  roleKey: AdminRoleKey;
  status: string;
  frozenSince: string | null;
  daysFrozen: number | null;
  isLongFreeze: boolean;
  ownedUsers: number;
  countsByState: Record<string, number>;
};

// The Admins page and the frozen-admins list: every Sales Admin and Supervisor with what they own.
export const readAdmins = async ({
  client,
  roleKeys,
  now = new Date(),
}: {
  client: RecordsClient;
  roleKeys: Map<string, AdminRoleKey>;
  now?: Date;
}): Promise<AdminRow[]> => {
  const memberIds = [...roleKeys.keys()];

  if (memberIds.length === 0) {
    return [];
  }

  const [members, ownerships] = await Promise.all([
    listRecords<{
      id: string;
      name: { firstName: string | null; lastName: string | null } | null;
      crmStatus: string | null;
      frozenSince: string | null;
    }>(client, 'workspaceMembers', { id: { in: memberIds } }, {
      name: { firstName: true, lastName: true },
      crmStatus: true,
      frozenSince: true,
    }),
    listRecords<{ adminId: string | null; state: string | null }>(
      client,
      'ownerships',
      { openUserKey: { is: 'NOT_NULL' } },
      { adminId: true, state: true },
    ),
  ]);

  return members.map((member) => {
    const owned = ownerships.filter(({ adminId }) => adminId === member.id);
    const frozenDays = member.frozenSince ? daysFrozen(new Date(member.frozenSince), now) : null;
    const countsByState: Record<string, number> = {};

    for (const { state } of owned) {
      countsByState[state ?? 'UNKNOWN'] = (countsByState[state ?? 'UNKNOWN'] ?? 0) + 1;
    }

    return {
      memberId: member.id,
      name: [member.name?.firstName, member.name?.lastName].filter(Boolean).join(' '),
      roleKey: roleKeys.get(member.id) as AdminRoleKey,
      status: member.crmStatus ?? 'ACTIVE',
      frozenSince: member.frozenSince,
      daysFrozen: frozenDays,
      isLongFreeze: member.crmStatus === 'FROZEN' && (frozenDays ?? 0) >= LONG_FREEZE_DAYS,
      ownedUsers: owned.length,
      countsByState,
    };
  });
};
