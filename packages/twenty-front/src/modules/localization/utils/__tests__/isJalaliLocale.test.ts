import { isJalaliLocale } from '@/localization/utils/isJalaliLocale';
import { enUS } from 'date-fns/locale';
import { faIR } from 'date-fns-jalali/locale';

describe('isJalaliLocale', () => {
  it('should be true for the jalali fa-IR catalog', () => {
    expect(isJalaliLocale(faIR)).toBe(true);
  });

  it('should be false for other catalogs and when undefined', () => {
    expect(isJalaliLocale(enUS)).toBe(false);
    expect(isJalaliLocale(undefined)).toBe(false);
  });
});
