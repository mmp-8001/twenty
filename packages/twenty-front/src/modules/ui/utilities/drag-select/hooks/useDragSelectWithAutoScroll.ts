import { useCallback } from 'react';

import { ScrollWrapperComponentInstanceContext } from '@/ui/utilities/scroll/states/contexts/ScrollWrapperComponentInstanceContext';
import { useComponentInstanceStateContext } from '@/ui/utilities/state/component-state/hooks/useComponentInstanceStateContext';
import { isNonEmptyString } from '@sniptt/guards';
import { AUTO_SCROLL_EDGE_THRESHOLD_PX } from '@/ui/utilities/drag-select/constants/AutoScrollEdgeThresholdPx';
import { AUTO_SCROLL_MAX_SPEED_PX } from '@/ui/utilities/drag-select/constants/AutoScrollMaxSpeedPx';

export const useDragSelectWithAutoScroll = () => {
  const scrollWrapperInstanceId = useComponentInstanceStateContext(
    ScrollWrapperComponentInstanceContext,
  )?.instanceId;

  const handleAutoScroll = useCallback(
    (mouseX: number, mouseY: number) => {
      if (!isNonEmptyString(scrollWrapperInstanceId)) {
        return;
      }

      const scrollWrapperHTMLElement = document.getElementById(
        `scroll-wrapper-${scrollWrapperInstanceId}`,
      );

      if (!scrollWrapperHTMLElement) {
        return;
      }

      const containerRect = scrollWrapperHTMLElement.getBoundingClientRect();

      const nearTop =
        mouseY - containerRect.top < AUTO_SCROLL_EDGE_THRESHOLD_PX;
      const nearBottom =
        containerRect.bottom - mouseY < AUTO_SCROLL_EDGE_THRESHOLD_PX;
      const nearLeft =
        mouseX - containerRect.left < AUTO_SCROLL_EDGE_THRESHOLD_PX;
      const nearRight =
        containerRect.right - mouseX < AUTO_SCROLL_EDGE_THRESHOLD_PX;

      const currentScrollTop = scrollWrapperHTMLElement.scrollTop;

      if (nearTop) {
        const newScrollTop = Math.max(
          0,
          currentScrollTop - AUTO_SCROLL_MAX_SPEED_PX,
        );
        scrollWrapperHTMLElement.scrollTo({ top: newScrollTop });
      } else if (nearBottom) {
        const newScrollTop = currentScrollTop + AUTO_SCROLL_MAX_SPEED_PX;
        scrollWrapperHTMLElement.scrollTo({ top: newScrollTop });
      }

      // scrollBy with a signed delta stays correct when RTL makes scrollLeft negative
      if (nearLeft) {
        scrollWrapperHTMLElement.scrollBy({
          left: -AUTO_SCROLL_MAX_SPEED_PX,
          behavior: 'auto',
        });
      } else if (nearRight) {
        scrollWrapperHTMLElement.scrollBy({
          left: AUTO_SCROLL_MAX_SPEED_PX,
          behavior: 'auto',
        });
      }
    },
    [scrollWrapperInstanceId],
  );

  return {
    handleAutoScroll,
  };
};
