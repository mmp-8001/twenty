export type SeedReason = {
  kind: 'DISSATISFACTION' | 'DO_NOT_CONTACT';
  name: string;
};

// Persian on purpose: Reasons are workspace data, not translated at runtime. Satisfaction reasons start empty.
export const SEED_REASONS: SeedReason[] = [
  { kind: 'DISSATISFACTION', name: 'علاقه‌ای ندارد' },
  { kind: 'DISSATISFACTION', name: 'قیمت بالاست' },
  { kind: 'DISSATISFACTION', name: 'آگاهی کافی ندارد' },
  { kind: 'DISSATISFACTION', name: 'منتظر بودجه است' },
  { kind: 'DISSATISFACTION', name: 'قوانین چالش سخت است' },
  { kind: 'DISSATISFACTION', name: 'از پلتفرم‌های دیگر می‌خرد' },
  { kind: 'DO_NOT_CONTACT', name: 'اطلاعات تماس اشتباه است' },
  { kind: 'DO_NOT_CONTACT', name: 'معامله‌گر نیست یا فقط معرفی است' },
  { kind: 'DO_NOT_CONTACT', name: 'درخواست کرده تماس گرفته نشود' },
];
