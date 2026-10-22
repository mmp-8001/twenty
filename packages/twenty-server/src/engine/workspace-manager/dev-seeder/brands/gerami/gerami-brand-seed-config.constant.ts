import { WorkspaceActivationStatus } from 'twenty-shared/workspace';

import { SEED_GERAMI_WORKSPACE_ID } from 'src/engine/workspace-manager/dev-seeder/brands/constants/brand-workspace-ids.constant';
import { type BrandSeedConfig } from 'src/engine/workspace-manager/dev-seeder/brands/types/brand-seed-config.type';
import {
  dateTimeField,
  numberField,
  selectField,
  textField,
} from 'src/engine/workspace-manager/dev-seeder/brands/utils/brand-field-seed-builders.util';
import { buildBrandMemberSeeds } from 'src/engine/workspace-manager/dev-seeder/brands/utils/build-brand-member-seeds.util';

export const GERAMI_BRAND_SEED_CONFIG: BrandSeedConfig = {
  workspace: {
    id: SEED_GERAMI_WORKSPACE_ID,
    displayName: 'گرمی',
    subdomain: 'gerami',
    inviteHash: 'gerami.dev-invite-hash',
    logo: '',
    activationStatus: WorkspaceActivationStatus.PENDING_CREATION,
    isTwoFactorAuthenticationEnforced: false,
  },
  members: buildBrandMemberSeeds(SEED_GERAMI_WORKSPACE_ID, 'gerami.dev', [
    ['maryam', 'مریم', 'احمدی', 'MANAGER'],
    ['ali', 'علی', 'رضایی', 'SALES'],
    ['sara', 'سارا', 'کریمی', 'SALES'],
    ['reza', 'رضا', 'محمدی', 'SUPPORT'],
  ]),
  objects: [
    {
      nameSingular: 'deliveryRequest',
      namePlural: 'deliveryRequests',
      labelSingular: 'درخواست تحویل',
      labelPlural: 'درخواست‌های تحویل',
      icon: 'IconTruckDelivery',
      color: 'yellow',
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
            ['NEW', 'جدید'],
            ['CHAMPIONS', 'قهرمان'],
            ['LOYAL', 'وفادار'],
            ['AT_RISK', 'در معرض ریزش'],
            ['HIBERNATING', 'خواب'],
          ],
        }),
        numberField({
          name: 'goldGrams',
          label: 'طلا (گرم)',
          icon: 'IconCoin',
          decimals: 3,
        }),
        numberField({
          name: 'silverGrams',
          label: 'نقره (گرم)',
          icon: 'IconCoin',
          decimals: 3,
        }),
        numberField({
          name: 'walletBalance',
          label: 'موجودی کیف پول (تومان)',
          icon: 'IconWallet',
        }),
        numberField({
          name: 'holdingsValue',
          label: 'ارزش دارایی (تومان)',
          icon: 'IconPigMoney',
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
            ['FIRST_WALLET_FUNDING', 'اولین شارژ کیف پول'],
            ['FIRST_BUY', 'اولین خرید'],
            ['FIRST_SELL', 'اولین فروش'],
            ['FIRST_WITHDRAWAL', 'اولین برداشت'],
            ['LARGE_BUY', 'خرید بزرگ'],
          ],
        }),
      ],
    },
    {
      objectName: 'deliveryRequest',
      seeds: [
        textField({
          name: 'appDeliveryId',
          label: 'شناسه درخواست در اپ',
          icon: 'IconId',
          isUnique: true,
        }),
        selectField({
          name: 'metal',
          label: 'فلز',
          icon: 'IconCoin',
          options: [
            ['GOLD', 'طلا'],
            ['SILVER', 'نقره'],
          ],
        }),
        selectField({
          name: 'product',
          label: 'محصول',
          icon: 'IconPackage',
          options: [
            ['EMAMI_COIN', 'سکه امامی'],
            ['HALF_COIN', 'نیم سکه'],
            ['QUARTER_COIN', 'ربع سکه'],
            ['GERAMI_COIN', 'سکه گرمی'],
            ['GOLD_BAR', 'شمش طلا'],
            ['SILVER_BAR', 'شمش نقره'],
          ],
        }),
        numberField({ name: 'quantity', label: 'تعداد', icon: 'IconHash' }),
        numberField({
          name: 'weightGrams',
          label: 'وزن (گرم)',
          icon: 'IconScale',
          decimals: 3,
        }),
        selectField({
          name: 'method',
          label: 'روش تحویل',
          icon: 'IconTruck',
          options: [
            ['BRANCH_PICKUP', 'تحویل حضوری در شعبه'],
            ['COURIER', 'پیک'],
          ],
        }),
        textField({ name: 'city', label: 'شهر', icon: 'IconMapPin' }),
        selectField({
          name: 'status',
          label: 'وضعیت',
          icon: 'IconProgressCheck',
          options: [
            ['REQUESTED', 'ثبت شده'],
            ['PREPARING', 'در حال آماده‌سازی'],
            ['READY', 'آماده تحویل'],
            ['DELIVERED', 'تحویل شده'],
            ['CANCELLED', 'لغو شده'],
          ],
          defaultValue: 'REQUESTED',
        }),
        dateTimeField({
          name: 'requestedAt',
          label: 'تاریخ درخواست',
          icon: 'IconCalendarEvent',
        }),
        dateTimeField({
          name: 'statusChangedAt',
          label: 'تاریخ تغییر وضعیت',
          icon: 'IconCalendarEvent',
        }),
        textField({
          name: 'trackingCode',
          label: 'کد رهگیری',
          icon: 'IconBarcode',
        }),
      ],
    },
  ],
  relations: [
    {
      objectName: 'deliveryRequest',
      name: 'customer',
      label: 'مشتری',
      icon: 'IconUser',
      targetObjectName: 'person',
      inverseName: 'deliveryRequests',
      inverseLabel: 'درخواست‌های تحویل',
      inverseIcon: 'IconTruckDelivery',
    },
  ],
};
