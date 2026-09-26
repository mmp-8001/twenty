import { toPersianDigits } from '@/localization/utils/formatToPersianDigits';

describe('toPersianDigits', () => {
  it('should replace ASCII digits with Persian-Indic ones', () => {
    expect(toPersianDigits('1403/05/12')).toBe('۱۴۰۳/۰۵/۱۲');
  });

  it('should leave non-digit characters untouched', () => {
    expect(toPersianDigits('مرداد ۱۴۰۳')).toBe('مرداد ۱۴۰۳');
    expect(toPersianDigits('')).toBe('');
  });
});
