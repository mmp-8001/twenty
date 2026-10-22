import { WorkspaceActivationStatus } from 'twenty-shared/workspace';

import { SEED_KIFPOOL_WORKSPACE_ID } from 'src/engine/workspace-manager/dev-seeder/brands/constants/brand-workspace-ids.constant';
import { type BrandSeedConfig } from 'src/engine/workspace-manager/dev-seeder/brands/types/brand-seed-config.type';
import {
  numberField,
  selectField,
  textField,
} from 'src/engine/workspace-manager/dev-seeder/brands/utils/brand-field-seed-builders.util';
import { buildBrandMemberSeeds } from 'src/engine/workspace-manager/dev-seeder/brands/utils/build-brand-member-seeds.util';

export const KIFPOOL_BRAND_SEED_CONFIG: BrandSeedConfig = {
  workspace: {
    id: SEED_KIFPOOL_WORKSPACE_ID,
    displayName: 'کیف پول',
    subdomain: 'kifpool',
    inviteHash: 'kifpool.dev-invite-hash',
    logo: '',
    activationStatus: WorkspaceActivationStatus.PENDING_CREATION,
    isTwoFactorAuthenticationEnforced: false,
  },
  members: buildBrandMemberSeeds(SEED_KIFPOOL_WORKSPACE_ID, 'kifpool.dev', [
    ['negar', 'نگار', 'حسینی', 'MANAGER'],
    ['amir', 'امیر', 'جعفری', 'SALES'],
    ['zahra', 'زهرا', 'موسوی', 'SALES'],
    ['hossein', 'حسین', 'نوری', 'SUPPORT'],
  ]),
  objects: [],
  fields: [
    {
      objectName: 'person',
      seeds: [
        selectField({
          name: 'segment',
          label: 'بخش',
          icon: 'IconChartPie',
          options: [
            ['NEW', 'جدید'],
            ['WITHDRAWING', 'در حال برداشت'],
            ['ACTIVE_TRADER', 'معامله‌گر فعال'],
            ['REGULAR', 'عادی'],
            ['HOLDER', 'نگهدارنده'],
            ['DORMANT', 'خاموش'],
          ],
        }),
        selectField({
          name: 'accountType',
          label: 'نوع حساب',
          icon: 'IconBuildingBank',
          options: [
            ['INDIVIDUAL', 'حقیقی'],
            ['CORPORATE', 'حقوقی'],
          ],
          defaultValue: 'INDIVIDUAL',
        }),
        textField({
          name: 'legalName',
          label: 'نام شرکت',
          icon: 'IconBuilding',
        }),
        textField({
          name: 'nationalId',
          label: 'شناسه ملی',
          icon: 'IconId',
        }),
        selectField({
          name: 'kycLevel',
          label: 'سطح احراز هویت',
          icon: 'IconShieldCheck',
          options: [
            ['LEVEL_0', 'سطح ۰'],
            ['LEVEL_1', 'سطح ۱'],
            ['LEVEL_2', 'سطح ۲'],
          ],
          defaultValue: 'LEVEL_0',
        }),
        selectField({
          name: 'kycStatus',
          label: 'وضعیت احراز هویت',
          icon: 'IconProgressCheck',
          options: [
            ['NONE', 'بدون درخواست'],
            ['PENDING', 'در انتظار بررسی'],
            ['REJECTED', 'رد شده'],
            ['APPROVED', 'تأیید شده'],
          ],
          defaultValue: 'NONE',
        }),
        selectField({
          name: 'kycRejectionReason',
          label: 'دلیل رد احراز هویت',
          icon: 'IconAlertTriangle',
          options: [
            ['BLURRY_DOCUMENT', 'مدرک ناخوانا'],
            ['NAME_MISMATCH', 'مغایرت نام'],
            ['SHAHKAR_MISMATCH', 'عدم تطابق شاهکار'],
            ['SELFIE_FAILED', 'سلفی ناموفق'],
            ['OTHER', 'سایر'],
          ],
        }),
        numberField({
          name: 'tomanBalance',
          label: 'موجودی تومانی',
          icon: 'IconWallet',
        }),
        numberField({
          name: 'cryptoValue',
          label: 'ارزش رمزارز (تومان)',
          icon: 'IconCurrencyBitcoin',
        }),
        numberField({
          name: 'holdingsValue',
          label: 'ارزش دارایی (تومان)',
          icon: 'IconPigMoney',
        }),
        numberField({
          name: 'referralCount',
          label: 'تعداد معرفی',
          icon: 'IconUsersPlus',
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
            ['KYC_LEVEL_2', 'احراز هویت سطح ۲'],
            ['FIRST_TOMAN_DEPOSIT', 'اولین واریز تومانی'],
            ['FIRST_CRYPTO_DEPOSIT', 'اولین واریز رمزارز'],
            ['FIRST_TRADE', 'اولین معامله'],
            ['FIRST_TOMAN_WITHDRAWAL', 'اولین برداشت تومانی'],
            ['FIRST_CRYPTO_WITHDRAWAL', 'اولین برداشت رمزارز'],
            ['LARGE_WITHDRAWAL', 'برداشت بزرگ'],
          ],
        }),
      ],
    },
  ],
  relations: [
    {
      objectName: 'person',
      name: 'referredBy',
      label: 'معرف',
      icon: 'IconUserShare',
      targetObjectName: 'person',
      inverseName: 'referredCustomers',
      inverseLabel: 'مشتریان معرفی‌شده',
      inverseIcon: 'IconUsersPlus',
    },
  ],
};
