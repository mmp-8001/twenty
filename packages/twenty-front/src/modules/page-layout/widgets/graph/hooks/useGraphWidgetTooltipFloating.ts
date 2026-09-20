import { GRAPH_TOOLTIP_BOUNDARY_PADDING_PX } from '@/page-layout/widgets/graph/constants/GraphTooltipBoundaryPaddingPx';
import { createVirtualElementFromSVGElement } from '@/page-layout/widgets/graph/utils/createVirtualElementFromSVGElement';
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  type VirtualElement,
} from '@floating-ui/react';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { useTextDirection } from '@/localization/hooks/useTextDirection';
import { flipPlacementForDirection } from '@/localization/utils/flipPlacementForDirection';

export const useGraphWidgetTooltipFloating = (
  referenceElement: Element | VirtualElement | null,
  boundaryElement: Element | null,
  tooltipOffsetFromAnchorInPx: number,
) => {
  const virtualElement = useMemo(() => {
    if (!isDefined(referenceElement)) return null;
    if (referenceElement instanceof Element) {
      return createVirtualElementFromSVGElement(referenceElement);
    }
    return referenceElement;
  }, [referenceElement]);

  const rootBoundary = document.querySelector('#root') ?? undefined;

  // Anchor on the inline-start side: physical left in LTR, right in RTL.
  const direction = useTextDirection();

  const { refs, x, y, isPositioned } = useFloating({
    elements: {
      reference: virtualElement,
    },
    placement: flipPlacementForDirection('left', direction),
    strategy: 'fixed',
    middleware: [
      offset(tooltipOffsetFromAnchorInPx),
      flip({
        fallbackPlacements: [
          flipPlacementForDirection('right', direction),
          'top',
          'bottom',
        ],
        boundary: boundaryElement ?? rootBoundary,
      }),
      shift({
        boundary: boundaryElement ?? rootBoundary,
        padding: GRAPH_TOOLTIP_BOUNDARY_PADDING_PX,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  return { refs, x, y, isPositioned };
};
