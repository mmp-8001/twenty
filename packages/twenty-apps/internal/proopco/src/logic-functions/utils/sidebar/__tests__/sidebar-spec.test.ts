import { describe, expect, it } from 'vitest';

import {
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { sidebarSpecOf } from 'src/logic-functions/utils/sidebar/sidebar-spec.util';

const summary = (roleIdentifiers: string[], hasAgent = false, locale = 'en') =>
  sidebarSpecOf({ roleIdentifiers, hasAgent, locale }).map(({ name, targets }) => [name, targets.length]);

describe('sidebarSpecOf', () => {
  it('gives an Agent one work folder of six items, first the follow-ups page layout', () => {
    const [folder] = sidebarSpecOf({ roleIdentifiers: [AGENT_ROLE_UNIVERSAL_IDENTIFIER], hasAgent: true, locale: 'en' });

    expect(folder?.name).toBe('My work');
    expect(folder?.targets).toHaveLength(6);
    expect(folder?.targets[0]?.kind).toBe('PAGE_LAYOUT');
  });

  it('gives a Supervisor management, plus work only when their member has an Agent', () => {
    expect(summary([SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER])).toEqual([['Management', 6]]);
    expect(summary([SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER], true)).toEqual([['Management', 6], ['My work', 6]]);
  });

  it('gives a Full Admin the supervisor items plus three', () => {
    expect(summary([FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER])).toEqual([['Management', 9]]);
  });

  it('gives the technical admin, who holds no Proopco role, two more items', () => {
    expect(summary(['some-builtin-admin-role'])).toEqual([['Management', 11]]);
  });

  it('gives a deactivated user nothing', () => {
    expect(summary([DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER, AGENT_ROLE_UNIVERSAL_IDENTIFIER])).toEqual([]);
  });

  it('names folders by locale', () => {
    expect(summary([AGENT_ROLE_UNIVERSAL_IDENTIFIER], false, 'fa-IR')).toEqual([['کار من', 6]]);
    expect(summary([FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER], false, 'fa-IR')).toEqual([['مدیریت', 9]]);
  });
});
