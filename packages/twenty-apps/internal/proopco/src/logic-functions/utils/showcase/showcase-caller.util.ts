import { type RoutePayload } from 'twenty-sdk/define';

import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { memberDisplayName, resolveCodeCaller } from 'src/logic-functions/utils/code-caller.util';
import { type RecordsClient } from 'src/logic-functions/utils/records.util';
import { Refusal } from 'src/logic-functions/utils/refusal.util';

const PROOPCO_ROLES = [
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER,
];

// Only the technical account keeps Twenty's built-in Admin and holds no Proopco role.
export const resolveShowcaseCaller = async (client: RecordsClient, routePayload: RoutePayload<unknown>) => {
  const caller = await resolveCodeCaller(client, routePayload);

  if (caller.roles.some((role) => PROOPCO_ROLES.includes(role))) {
    throw new Refusal(403, 'TECHNICAL_ADMIN_ONLY', 'Only the technical admin can do this.');
  }

  return { memberId: caller.member.id, name: memberDisplayName(caller) || 'Technical admin' };
};
