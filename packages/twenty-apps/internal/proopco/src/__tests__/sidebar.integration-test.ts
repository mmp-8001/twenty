import { CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  AGENT_ROLE_UNIVERSAL_IDENTIFIER,
  AGENTS_VIEW_UNIVERSAL_IDENTIFIER,
  AWAITING_PAYMENT_VIEW_UNIVERSAL_IDENTIFIER,
  CALLS_VIEW_UNIVERSAL_IDENTIFIER,
  CAMPAIGNS_VIEW_UNIVERSAL_IDENTIFIER,
  CONTACT_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER,
  DISCOUNT_CODES_VIEW_UNIVERSAL_IDENTIFIER,
  FAILED_PLATFORM_EVENTS_VIEW_UNIVERSAL_IDENTIFIER,
  FROZEN_AGENTS_VIEW_UNIVERSAL_IDENTIFIER,
  FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOMES_VIEW_UNIVERSAL_IDENTIFIER,
  MY_CUSTOMERS_VIEW_UNIVERSAL_IDENTIFIER,
  MY_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
  MY_REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  REASONS_VIEW_UNIVERSAL_IDENTIFIER,
  REPORT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  SEGMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  SETTINGS_VIEW_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { MEMBER_ROLE_UNIVERSAL_IDENTIFIER } from 'twenty-shared/constants';

import { listMembers } from './fixtures';
import { assignRole, listRoles, signInAs } from './user-session';

const PHIL = 'phil.schiler@apple.dev';

const HOME = [REPORT_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER];
const MY_WORK = [
  MY_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  CONTACT_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  MY_REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER,
  MY_CUSTOMERS_VIEW_UNIVERSAL_IDENTIFIER,
  MY_HISTORY_VIEW_UNIVERSAL_IDENTIFIER,
  CALLS_VIEW_UNIVERSAL_IDENTIFIER,
];
const SUPERVISOR_MANAGEMENT = [
  CAMPAIGNS_VIEW_UNIVERSAL_IDENTIFIER,
  SEGMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  AGENTS_VIEW_UNIVERSAL_IDENTIFIER,
  FROZEN_AGENTS_VIEW_UNIVERSAL_IDENTIFIER,
  MONTHLY_INCOMES_VIEW_UNIVERSAL_IDENTIFIER,
  AWAITING_PAYMENT_VIEW_UNIVERSAL_IDENTIFIER,
];
const FULL_ADMIN_MANAGEMENT = [
  ...SUPERVISOR_MANAGEMENT,
  DISCOUNT_CODES_VIEW_UNIVERSAL_IDENTIFIER,
  REASONS_VIEW_UNIVERSAL_IDENTIFIER,
  SETTINGS_VIEW_UNIVERSAL_IDENTIFIER,
];
const ADMIN_MANAGEMENT = [
  ...FULL_ADMIN_MANAGEMENT,
  FAILED_PLATFORM_EVENTS_VIEW_UNIVERSAL_IDENTIFIER,
  CALLS_VIEW_UNIVERSAL_IDENTIFIER,
];

const APP_LABELS = new Set([...HOME, ...MY_WORK, ...ADMIN_MANAGEMENT]);

let philMemberId = '';
let previousRoleId = '';
let roleIdByIdentifier = new Map<string, string>();
let universalIdentifierById = new Map<string, string>();

const sidebarOf = async (token: string) => {
  const response = await fetch(`${process.env.TWENTY_API_URL}/metadata`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: '{ navigationMenuItems { viewId pageLayoutId } }',
    }),
  });
  const { data } = (await response.json()) as {
    data: {
      navigationMenuItems: {
        viewId: string | null;
        pageLayoutId: string | null;
      }[];
    };
  };

  return data.navigationMenuItems
    .map(
      ({ viewId, pageLayoutId }) =>
        universalIdentifierById.get(viewId ?? pageLayoutId ?? '') ?? '',
    )
    .filter((label) => APP_LABELS.has(label))
    .sort();
};

const sidebarAs = async (roleUniversalIdentifier: string) => {
  await assignRole(
    philMemberId,
    roleIdByIdentifier.get(roleUniversalIdentifier)!,
  );

  return sidebarOf(await signInAs(PHIL));
};

beforeAll(async () => {
  const roles = await listRoles();
  const { getViews, getPageLayouts } = await new MetadataApiClient().query({
    getViews: { id: true, universalIdentifier: true },
    getPageLayouts: { id: true, universalIdentifier: true },
  });

  philMemberId = (await listMembers(new CoreApiClient())).find(
    ({ userEmail }) => userEmail === PHIL,
  )!.id;
  previousRoleId = roles.find((role) =>
    role.workspaceMembers.some(({ id }) => id === philMemberId),
  )!.id;
  roleIdByIdentifier = new Map(
    roles.map(({ id, universalIdentifier }) => [universalIdentifier, id]),
  );
  universalIdentifierById = new Map(
    [...getViews, ...getPageLayouts].map(({ id, universalIdentifier }) => [
      id,
      universalIdentifier as string,
    ]),
  );
});

afterAll(async () => {
  await assignRole(philMemberId, previousRoleId);
});

describe('sidebar by role', () => {
  it.each([
    ['Agent', AGENT_ROLE_UNIVERSAL_IDENTIFIER, [...HOME, ...MY_WORK]],
    [
      'Supervisor',
      SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
      [...HOME, ...MY_WORK, ...SUPERVISOR_MANAGEMENT],
    ],
    [
      'Full Admin',
      FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER,
      [...HOME, ...FULL_ADMIN_MANAGEMENT],
    ],
    ['Admin', ADMIN_ROLE_UNIVERSAL_IDENTIFIER, [...HOME, ...ADMIN_MANAGEMENT]],
    ['Member', MEMBER_ROLE_UNIVERSAL_IDENTIFIER, HOME],
    ['Deactivated', DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER, HOME],
  ])(
    'shows the %s their items only',
    async (_name, roleUniversalIdentifier, expected) => {
      expect(await sidebarAs(roleUniversalIdentifier)).toEqual(
        [...expected].sort(),
      );
    },
  );
});
