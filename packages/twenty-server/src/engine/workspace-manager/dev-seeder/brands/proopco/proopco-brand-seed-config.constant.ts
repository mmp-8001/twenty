import { WorkspaceActivationStatus } from 'twenty-shared/workspace';

import { SEED_PROOPCO_WORKSPACE_ID } from 'src/engine/workspace-manager/dev-seeder/brands/constants/brand-workspace-ids.constant';
import { type BrandSeedConfig } from 'src/engine/workspace-manager/dev-seeder/brands/types/brand-seed-config.type';
import {
  dateTimeField,
  numberField,
  selectField,
  textField,
} from 'src/engine/workspace-manager/dev-seeder/brands/utils/brand-field-seed-builders.util';
import { buildBrandMemberSeeds } from 'src/engine/workspace-manager/dev-seeder/brands/utils/build-brand-member-seeds.util';

export const PROOPCO_BRAND_SEED_CONFIG: BrandSeedConfig = {
  workspace: {
    id: SEED_PROOPCO_WORKSPACE_ID,
    displayName: 'پروپکو',
    subdomain: 'proopco',
    inviteHash: 'proopco.dev-invite-hash',
    logo: '',
    activationStatus: WorkspaceActivationStatus.PENDING_CREATION,
    isTwoFactorAuthenticationEnforced: false,
  },
  members: buildBrandMemberSeeds(SEED_PROOPCO_WORKSPACE_ID, 'proopco.dev', [
    ['parisa', 'پریسا', 'صادقی', 'MANAGER'],
    ['mohammad', 'محمد', 'کاظمی', 'SALES'],
    ['elham', 'الهام', 'رحیمی', 'SALES'],
    ['behnam', 'بهنام', 'قاسمی', 'SUPPORT'],
  ]),
  objects: [
    {
      nameSingular: 'challengeAccount',
      namePlural: 'challengeAccounts',
      labelSingular: 'حساب چالش',
      labelPlural: 'حساب‌های چالش',
      icon: 'IconTrophy',
      color: 'turquoise',
      isRemote: false,
    },
  ],
  fields: [
    {
      objectName: 'person',
      seeds: [
        selectField({
          name: 'segment',
          label: 'بخش',
          icon: 'IconChartPie',
          options: [
            ['EARNING', 'در حال دریافت سود'],
            ['FUNDED', 'تأمین سرمایه شده'],
            ['IN_CHALLENGE', 'در چالش'],
            ['RETRY_CANDIDATE', 'کاندید تلاش دوباره'],
            ['NEW', 'جدید'],
            ['LAPSED', 'رها کرده'],
          ],
        }),
        numberField({
          name: 'activeChallengeCount',
          label: 'چالش‌های فعال',
          icon: 'IconTrophy',
        }),
        numberField({
          name: 'fundedAccountCount',
          label: 'حساب‌های تأمین سرمایه شده',
          icon: 'IconAward',
        }),
        numberField({
          name: 'fundedCapital',
          label: 'سرمایه تأمین شده (دلار)',
          icon: 'IconCurrencyDollar',
        }),
        numberField({
          name: 'payoutTotal',
          label: 'مجموع برداشت سود (تومان)',
          icon: 'IconCash',
        }),
        dateTimeField({
          name: 'lastPayoutAt',
          label: 'آخرین برداشت سود',
          icon: 'IconCalendarDollar',
        }),
        dateTimeField({
          name: 'lastBreachAt',
          label: 'آخرین نقض قانون',
          icon: 'IconAlertTriangle',
        }),
      ],
    },
    {
      objectName: 'milestone',
      seeds: [
        selectField({
          name: 'milestoneType',
          label: 'نوع',
          icon: 'IconTag',
          options: [
            ['VERIFIED', 'احراز هویت'],
            ['FIRST_CHALLENGE_PURCHASE', 'اولین خرید چالش'],
            ['FIRST_PHASE_PASSED', 'اولین قبولی فاز'],
            ['FIRST_FUNDED', 'اولین تأمین سرمایه'],
            ['FIRST_PAYOUT', 'اولین برداشت سود'],
            ['FIRST_SCALE_UP', 'اولین افزایش سرمایه'],
            ['LARGE_PAYOUT', 'برداشت سود بزرگ'],
          ],
        }),
      ],
    },
    {
      objectName: 'challengeAccount',
      seeds: [
        textField({
          name: 'appAccountId',
          label: 'شناسه حساب در اپ',
          icon: 'IconId',
          isUnique: true,
        }),
        numberField({
          name: 'accountSize',
          label: 'اندازه حساب (دلار)',
          icon: 'IconCurrencyDollar',
        }),
        selectField({
          name: 'phase',
          label: 'فاز',
          icon: 'IconStairsUp',
          options: [
            ['PHASE_1', 'فاز ۱'],
            ['PHASE_2', 'فاز ۲'],
            ['FUNDED', 'تأمین سرمایه شده'],
          ],
          defaultValue: 'PHASE_1',
        }),
        selectField({
          name: 'status',
          label: 'وضعیت',
          icon: 'IconProgressCheck',
          options: [
            ['ACTIVE', 'فعال'],
            ['PASSED', 'قبول شده'],
            ['BREACHED', 'نقض قانون'],
            ['CLOSED', 'بسته شده'],
          ],
          defaultValue: 'ACTIVE',
        }),
        dateTimeField({
          name: 'purchasedAt',
          label: 'تاریخ خرید',
          icon: 'IconCalendarEvent',
        }),
        dateTimeField({
          name: 'fundedAt',
          label: 'تاریخ تأمین سرمایه',
          icon: 'IconCalendarEvent',
        }),
        numberField({
          name: 'scaleLevel',
          label: 'سطح افزایش سرمایه',
          icon: 'IconTrendingUp',
        }),
        selectField({
          name: 'breachReason',
          label: 'دلیل نقض قانون',
          icon: 'IconAlertTriangle',
          options: [
            ['DAILY_LOSS', 'ضرر روزانه'],
            ['MAX_DRAWDOWN', 'حداکثر افت سرمایه'],
            ['RULE_VIOLATION', 'نقض قوانین'],
            ['INACTIVITY', 'عدم فعالیت'],
          ],
        }),
      ],
    },
  ],
  relations: [
    {
      objectName: 'challengeAccount',
      name: 'customer',
      label: 'مشتری',
      icon: 'IconUser',
      targetObjectName: 'person',
      inverseName: 'challengeAccounts',
      inverseLabel: 'حساب‌های چالش',
      inverseIcon: 'IconTrophy',
    },
  ],
};
