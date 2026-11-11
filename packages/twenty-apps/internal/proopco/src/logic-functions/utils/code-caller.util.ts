import { type RoutePayload } from 'twenty-sdk/define';
import { isDefined } from 'twenty-sdk/utils';

import {
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { type ActivationCaller } from 'src/logic-functions/utils/code-activation.util';
import {
  listRecords,
  type RecordsClient,
} from 'src/logic-functions/utils/records.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';
import {
  resolveCallerMemberId,
  resolveCallerRoleIdentifiers,
} from 'src/logic-functions/utils/resolve-caller.util';

type CallerMember = {
  id: string;
  name: { firstName: string; lastName: string } | null;
  agentId: string | null;
};

export const resolveCodeCaller = async (
  client: RecordsClient,
  routePayload: RoutePayload<unknown>,
): Promise<{ roles: string[]; member: CallerMember }> => {
  const memberId = await resolveCallerMemberId(routePayload);
  const roles = await resolveCallerRoleIdentifiers(routePayload);

  if (!isDefined(memberId) || roles === null) {
    throw new Refusal(401, 'SIGN_IN_REQUIRED', 'Sign in required');
  }

  const [member] = await listRecords<CallerMember>(
    client,
    'workspaceMembers',
    { id: { eq: memberId } },
    { name: { firstName: true, lastName: true }, agentId: true },
    1,
  );

  return { roles, member: member ?? { id: memberId, name: null, agentId: null } };
};

export const requireFullAdmin = ({ roles }: { roles: string[] }) => {
  if (!roles.includes(FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER)) {
    throw new Refusal(403, 'FULL_ADMIN_ONLY', 'Only a Full Admin can do this.');
  }
};

export const activationCallerOf = ({
  roles,
  member,
}: {
  roles: string[];
  member: CallerMember;
}): ActivationCaller => ({
  isStaff: [FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER, SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER].some((identifier) =>
    roles.includes(identifier),
  ),
  agentId: member.agentId,
});

export const memberDisplayName = ({ member }: { member: CallerMember }) =>
  `${member.name?.firstName ?? ''} ${member.name?.lastName ?? ''}`.trim();
