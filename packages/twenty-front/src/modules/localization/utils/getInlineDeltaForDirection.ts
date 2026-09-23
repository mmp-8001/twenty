import { type TextDirection } from 'twenty-shared/translations';

// A pointer delta is physical, but a resize grows the element toward the inline
// end, which is leftwards under RTL. Column resizing reads the pointer directly,
// so the CSS auto-flip never sees this and the sign has to be mirrored here.
export const getInlineDeltaForDirection = (
  physicalDeltaX: number,
  direction: TextDirection,
) => (direction === 'rtl' ? -physicalDeltaX : physicalDeltaX);
