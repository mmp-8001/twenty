import {
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SALES_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export type AdminRoleKey = 'SALES_ADMIN' | 'SUPERVISOR' | 'FULL_ADMIN';

const ROLE_KEY_BY_UNIVERSAL_IDENTIFIER: Record<string, AdminRoleKey> = {
  [SALES_ADMIN_ROLE_UNIVERSAL_IDENTIFIER]: 'SALES_ADMIN',
  [SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER]: 'SUPERVISOR',
  [FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER]: 'FULL_ADMIN',
};

export const roleKeyOf = (roleUniversalIdentifier: string | null | undefined): AdminRoleKey | null =>
  ROLE_KEY_BY_UNIVERSAL_IDENTIFIER[roleUniversalIdentifier ?? ''] ?? null;

// FRZ-01 and ROLE-02: a Supervisor or the Full Admin freezes a Sales Admin; only the Full Admin freezes a
// Supervisor; nobody freezes themself or the Full Admin.
export const canFreeze = ({
  callerId,
  callerRole,
  targetId,
  targetRole,
}: {
  callerId: string;
  callerRole: AdminRoleKey | null;
  targetId: string;
  targetRole: AdminRoleKey | null;
}): boolean => {
  if (callerId === targetId) {
    return false;
  }

  if (targetRole === 'SALES_ADMIN') {
    return callerRole === 'SUPERVISOR' || callerRole === 'FULL_ADMIN';
  }

  return targetRole === 'SUPERVISOR' && callerRole === 'FULL_ADMIN';
};

// TRF-01: moving or releasing Users is for Supervisors and the Full Admin.
export const canManageOwnership = (callerRole: AdminRoleKey | null): boolean =>
  callerRole === 'SUPERVISOR' || callerRole === 'FULL_ADMIN';

export const canDeactivate = ({ callerId, callerRole, targetId }: {
  callerId: string;
  callerRole: AdminRoleKey | null;
  targetId: string;
}): boolean => callerRole === 'FULL_ADMIN' && callerId !== targetId;
