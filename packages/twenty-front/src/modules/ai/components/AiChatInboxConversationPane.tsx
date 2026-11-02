import { useLingui } from '@lingui/react/macro';
import { styled } from '@linaria/react';
import { motion, useIsPresent, useReducedMotion } from 'framer-motion';
import { type ReactNode } from 'react';
import { getLocaleTextDirection } from 'twenty-shared/translations';
import { ANIMATION } from 'twenty-ui/theme';

import { AiChatInboxConversationCloseEffect } from '@/ai/components/AiChatInboxConversationCloseEffect';

const StyledPane = styled(motion.div)`
  bottom: 0;
  display: flex;
  flex: 1;
  min-height: 0;
  min-width: 0;
  position: relative;
  right: 0;
  top: 0;
  width: 100%;

  &[data-split-view='true'] {
    position: absolute;
    width: calc(100% - var(--inbox-list-pane-width));
  }
`;

type AiChatInboxConversationPaneProps = {
  children: ReactNode;
  isSplitView: boolean;
};

export const AiChatInboxConversationPane = ({
  children,
  isSplitView,
}: AiChatInboxConversationPaneProps) => {
  const { t, i18n } = useLingui();
  const isPresent = useIsPresent();
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = isSplitView && !shouldReduceMotion;
  const offscreenX =
    getLocaleTextDirection(i18n.locale) === 'rtl' ? '-100%' : '100%';

  return (
    <StyledPane
      data-split-view={isSplitView}
      role="region"
      aria-label={t`Conversation`}
      aria-hidden={!isPresent}
      inert={!isPresent || undefined}
      initial={{ x: shouldAnimate ? offscreenX : 0 }}
      animate={{ x: 0 }}
      exit={{ x: shouldAnimate ? offscreenX : 0 }}
      transition={{
        duration: shouldAnimate ? ANIMATION.duration.normal : 0,
        ease: 'easeInOut',
      }}
    >
      <AiChatInboxConversationCloseEffect isPresent={isPresent} />
      {children}
    </StyledPane>
  );
};
