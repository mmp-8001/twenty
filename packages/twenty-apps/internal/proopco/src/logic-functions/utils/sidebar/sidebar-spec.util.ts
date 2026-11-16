import {
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
  SEGMENTS_VIEW_UNIVERSAL_IDENTIFIER,
  SETTINGS_VIEW_UNIVERSAL_IDENTIFIER,
  SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export type SidebarTarget = {
  kind: 'VIEW' | 'PAGE_LAYOUT';
  universalIdentifier: string;
};

export type SidebarFolder = {
  name: string;
  icon: string;
  targets: SidebarTarget[];
};

export const FOLDER_NAMES = {
  myWork: { fa: 'کار من', en: 'My work' },
  management: { fa: 'مدیریت', en: 'Management' },
};

const view = (universalIdentifier: string): SidebarTarget => ({ kind: 'VIEW', universalIdentifier });

const AGENT_TARGETS = [
  { kind: 'PAGE_LAYOUT', universalIdentifier: MY_FOLLOW_UPS_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER },
  view(CONTACT_LIST_VIEW_UNIVERSAL_IDENTIFIER),
  view(MY_REBUY_LIST_VIEW_UNIVERSAL_IDENTIFIER),
  view(MY_CUSTOMERS_VIEW_UNIVERSAL_IDENTIFIER),
  view(MY_HISTORY_VIEW_UNIVERSAL_IDENTIFIER),
  view(CALLS_VIEW_UNIVERSAL_IDENTIFIER),
] satisfies SidebarTarget[];

const SUPERVISOR_TARGETS = [
  view(CAMPAIGNS_VIEW_UNIVERSAL_IDENTIFIER),
  view(SEGMENTS_VIEW_UNIVERSAL_IDENTIFIER),
  view(AGENTS_VIEW_UNIVERSAL_IDENTIFIER),
  view(FROZEN_AGENTS_VIEW_UNIVERSAL_IDENTIFIER),
  view(MONTHLY_INCOMES_VIEW_UNIVERSAL_IDENTIFIER),
  view(AWAITING_PAYMENT_VIEW_UNIVERSAL_IDENTIFIER),
];

const FULL_ADMIN_TARGETS = [
  ...SUPERVISOR_TARGETS,
  view(DISCOUNT_CODES_VIEW_UNIVERSAL_IDENTIFIER),
  view(REASONS_VIEW_UNIVERSAL_IDENTIFIER),
  view(SETTINGS_VIEW_UNIVERSAL_IDENTIFIER),
];

const TECHNICAL_ADMIN_TARGETS = [
  ...FULL_ADMIN_TARGETS,
  view(FAILED_PLATFORM_EVENTS_VIEW_UNIVERSAL_IDENTIFIER),
  view(CALLS_VIEW_UNIVERSAL_IDENTIFIER),
];

export const sidebarSpecOf = ({
  roleIdentifiers,
  hasAgent,
  locale,
}: {
  roleIdentifiers: string[];
  hasAgent: boolean;
  locale: string | null | undefined;
}): SidebarFolder[] => {
  const language = locale?.startsWith('fa') ? 'fa' : 'en';
  const has = (role: string) => roleIdentifiers.includes(role);
  const myWork = { name: FOLDER_NAMES.myWork[language], icon: 'IconHeadset', targets: AGENT_TARGETS };
  const management = (targets: SidebarTarget[]) => ({
    name: FOLDER_NAMES.management[language],
    icon: 'IconSettings',
    targets,
  });

  if (has(DEACTIVATED_ROLE_UNIVERSAL_IDENTIFIER)) {
    return [];
  }

  if (has(FULL_ADMIN_ROLE_UNIVERSAL_IDENTIFIER)) {
    return [management(FULL_ADMIN_TARGETS)];
  }

  if (has(SUPERVISOR_ROLE_UNIVERSAL_IDENTIFIER)) {
    return hasAgent ? [management(SUPERVISOR_TARGETS), myWork] : [management(SUPERVISOR_TARGETS)];
  }

  if (has(AGENT_ROLE_UNIVERSAL_IDENTIFIER)) {
    return [myWork];
  }

  return [management(TECHNICAL_ADMIN_TARGETS)];
};
