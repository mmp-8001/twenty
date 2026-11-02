import { styled } from '@linaria/react';
import { type ReactNode } from 'react';
import { themeCssVariables } from 'twenty-ui/theme';

type NestedSettingsRowProps = {
  children: ReactNode;
  isLast?: boolean;
  guideOffset?: string;
};

const StyledNestedRow = styled.div`
  margin-inline-start: ${themeCssVariables.spacing[8]};
  padding-inline-start: ${themeCssVariables.spacing[4]};
  position: relative;
`;

const StyledGuide = styled.div<{
  isLast: boolean;
  guideOffset: string;
}>`
  bottom: 0;
  inset-inline-start: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: ${themeCssVariables.spacing[4]};

  &::before {
    background: ${themeCssVariables.border.color.strong};
    bottom: 0;
    content: '';
    display: ${({ isLast }) => (isLast ? 'none' : 'block')};
    inset-inline-start: 0;
    position: absolute;
    top: 0;
    width: 1px;
  }

  &::after {
    border-bottom: 1px solid ${themeCssVariables.border.color.strong};
    border-end-start-radius: ${themeCssVariables.border.radius.sm};
    border-inline-start: 1px solid ${themeCssVariables.border.color.strong};
    box-sizing: border-box;
    content: '';
    height: ${({ guideOffset }) => guideOffset};
    inset-inline-start: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }
`;

// Settings rows own their top padding, so the guide covers that inset too.
export const NestedSettingsRow = ({
  children,
  isLast = false,
  guideOffset = '50%',
}: NestedSettingsRowProps) => (
  <StyledNestedRow>
    <StyledGuide aria-hidden="true" isLast={isLast} guideOffset={guideOffset} />
    {children}
  </StyledNestedRow>
);
