import styled from '@emotion/styled';
import { type ReactNode } from 'react';
import { Callout } from 'twenty-ui/components/feedback';
import { type IconComponent } from 'twenty-ui/icon';
import { Loader } from 'twenty-ui/primitives/feedback';
import { themeCssVariables } from 'twenty-ui/theme';

const Centered = styled.div`
  align-items: center;
  color: ${() => themeCssVariables.font.color.tertiary};
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[2]};
  justify-content: center;
  padding: ${() => themeCssVariables.spacing[8]} ${() => themeCssVariables.spacing[4]};
  text-align: center;
`;

export const LoadingState = () => (
  <Centered role="status">
    <Loader />
  </Centered>
);

export const EmptyState = ({ icon: Icon, children }: { icon?: IconComponent; children: ReactNode }) => (
  <Centered>
    {Icon && <Icon size={24} />}
    <span>{children}</span>
  </Centered>
);

export const ErrorCallout = ({ title, hint }: { title: string; hint?: string }) => (
  <div role="alert">
    <Callout status="error" title={title} description={hint} fullWidth />
  </div>
);
