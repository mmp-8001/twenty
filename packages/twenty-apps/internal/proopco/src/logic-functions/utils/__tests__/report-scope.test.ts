import { describe, expect, it } from 'vitest';

import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { resolveReportScope } from 'src/logic-functions/utils/report.util';

describe('resolveReportScope', () => {
  it('limits an Agent to their own agent record', () => {
    expect(resolveReportScope({ roles: [AGENT_ROLE_UNIVERSAL_IDENTIFIER], memberAgentId: 'a1' })).toEqual({ isStaff: false, isFullAdmin: false, ownAgentId: 'a1' });
  });

  it('gives a Supervisor the team but not the failed-events count', () => {
    expect(resolveReportScope({ roles: [SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER], memberAgentId: 'a2' })).toMatchObject({ isStaff: true, isFullAdmin: false, ownAgentId: null });
  });

  it('gives a Full Admin the team and the failed-events count', () => {
    expect(resolveReportScope({ roles: [FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER], memberAgentId: null })).toMatchObject({ isStaff: true, isFullAdmin: true });
  });

  it('refuses a Deactivated user, an Agent without a record and a user with no role', () => {
    expect(() => resolveReportScope({ roles: [DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER, AGENT_ROLE_UNIVERSAL_IDENTIFIER], memberAgentId: 'a1' })).toThrow('no access');
    expect(() => resolveReportScope({ roles: [AGENT_ROLE_UNIVERSAL_IDENTIFIER], memberAgentId: null })).toThrow('no agent');
    expect(() => resolveReportScope({ roles: [], memberAgentId: 'a1' })).toThrow('no access');
  });
});
