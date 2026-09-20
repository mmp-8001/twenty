import { type Placement } from '@floating-ui/react';
import { type TextDirection } from 'twenty-shared/translations';

// floating-ui treats the primary side as physical: a `left` placement anchors
// on the physical left even under RTL, and only the `-start`/`-end` alignment
// is mirrored by its isRTL check. So mirror the side token ourselves to keep
// left/right-anchored popovers on the intended inline side. Vertical
// placements are left alone because their alignment already flips.
export const flipPlacementForDirection = (
  placement: Placement,
  direction: TextDirection,
): Placement => {
  if (direction !== 'rtl') {
    return placement;
  }

  if (placement.startsWith('left')) {
    return placement.replace('left', 'right') as Placement;
  }

  if (placement.startsWith('right')) {
    return placement.replace('right', 'left') as Placement;
  }

  return placement;
};
