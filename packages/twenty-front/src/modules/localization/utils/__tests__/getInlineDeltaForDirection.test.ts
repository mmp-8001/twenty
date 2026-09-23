import { getInlineDeltaForDirection } from '@/localization/utils/getInlineDeltaForDirection';

describe('getInlineDeltaForDirection', () => {
  it('keeps the pointer delta in ltr', () => {
    expect(getInlineDeltaForDirection(12, 'ltr')).toBe(12);
  });

  it('mirrors the pointer delta in rtl', () => {
    expect(getInlineDeltaForDirection(12, 'rtl')).toBe(-12);
    expect(getInlineDeltaForDirection(-12, 'rtl')).toBe(12);
  });
});
