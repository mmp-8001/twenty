import { flipPlacementForDirection } from '@/localization/utils/flipPlacementForDirection';

describe('flipPlacementForDirection', () => {
  it('should return the placement unchanged in LTR', () => {
    expect(flipPlacementForDirection('left-start', 'ltr')).toBe('left-start');
    expect(flipPlacementForDirection('right', 'ltr')).toBe('right');
  });

  it('should mirror the left<->right side token in RTL', () => {
    expect(flipPlacementForDirection('left', 'rtl')).toBe('right');
    expect(flipPlacementForDirection('right', 'rtl')).toBe('left');
    expect(flipPlacementForDirection('left-start', 'rtl')).toBe('right-start');
    expect(flipPlacementForDirection('right-end', 'rtl')).toBe('left-end');
  });

  it('should leave vertical placements untouched in RTL', () => {
    expect(flipPlacementForDirection('bottom-start', 'rtl')).toBe(
      'bottom-start',
    );
    expect(flipPlacementForDirection('top-end', 'rtl')).toBe('top-end');
    expect(flipPlacementForDirection('bottom', 'rtl')).toBe('bottom');
  });
});
