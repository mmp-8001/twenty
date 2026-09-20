const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

// date-fns-jalali emits Latin digits, so shaping happens at the display layer.
export const toPersianDigits = (input: string): string =>
  input.replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
