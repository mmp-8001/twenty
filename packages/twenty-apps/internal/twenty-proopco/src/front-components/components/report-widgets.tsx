import styled from '@emotion/styled';
import { type ReactNode } from 'react';
import { themeCssVariables } from 'twenty-ui/theme';

import { Card, MutedText, NumericValue } from 'src/front-components/components/layout';
import { type BreakdownEntry, type OutcomeTone } from 'src/utils/report-view.util';

export type BarTone = OutcomeTone | 'accent';

const barColor = (tone: BarTone) =>
  tone === 'success'
    ? themeCssVariables.color.green
    : tone === 'failure'
      ? themeCssVariables.color.red
      : tone === 'accent'
        ? themeCssVariables.color.blue
        : themeCssVariables.font.color.light;

const Track = styled.div`
  background: ${() => themeCssVariables.background.tertiary};
  border-radius: ${() => themeCssVariables.border.radius.pill};
  height: 6px;
  overflow: hidden;
`;

const Fill = styled.div<{ percent: number; tone: BarTone }>`
  background: ${({ tone }) => barColor(tone)};
  border-radius: inherit;
  height: 100%;
  inline-size: ${({ percent }) => Math.min(100, Math.max(0, percent))}%;
`;

export const ProgressBar = ({ percent, tone = 'accent', label }: { percent: number; tone?: BarTone; label: string }) => (
  <Track role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}>
    <Fill percent={percent} tone={tone} />
  </Track>
);

export const KpiGrid = styled.div`
  display: grid;
  gap: ${() => themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
`;

const KpiCardRoot = styled(Card)`
  background: ${() => themeCssVariables.background.secondary};
  border-color: ${() => themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[2]};
`;

const KpiValue = styled.span`
  color: ${() => themeCssVariables.font.color.primary};
  font-size: ${() => themeCssVariables.font.size.xl};
  font-weight: ${() => themeCssVariables.font.weight.semiBold};
  line-height: 1.2;
`;

export const KpiCard = ({
  label,
  value,
  caption,
  bar,
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  bar?: { percent: number; tone?: BarTone };
}) => (
  <KpiCardRoot>
    <MutedText>{label}</MutedText>
    <KpiValue>
      <NumericValue>{value}</NumericValue>
    </KpiValue>
    {bar && <ProgressBar percent={bar.percent} tone={bar.tone} label={label} />}
    {caption && <MutedText>{caption}</MutedText>}
  </KpiCardRoot>
);

const BreakdownItem = styled.li`
  display: grid;
  gap: ${() => themeCssVariables.spacing[1]} ${() => themeCssVariables.spacing[3]};
  grid-template-columns: 1fr auto;
`;

const BreakdownList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[3]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const BreakdownLabel = styled.span`
  color: ${() => themeCssVariables.font.color.secondary};
  font-size: ${() => themeCssVariables.font.size.sm};
  overflow-wrap: anywhere;
`;

const BreakdownCount = styled(NumericValue)`
  color: ${() => themeCssVariables.font.color.primary};
  font-size: ${() => themeCssVariables.font.size.sm};
  font-weight: ${() => themeCssVariables.font.weight.semiBold};
`;

const BarCell = styled.div`
  grid-column: 1 / -1;
`;

const CardTitle = styled.h4`
  color: ${() => themeCssVariables.font.color.primary};
  font-size: ${() => themeCssVariables.font.size.md};
  font-weight: ${() => themeCssVariables.font.weight.semiBold};
  margin: 0 0 ${() => themeCssVariables.spacing[3]};
`;

// Bars are proportional to the largest entry so the top row always fills the track.
export const BreakdownCard = ({
  title,
  entries,
  toneOf = () => 'accent',
  formatCount,
  emptyText,
}: {
  title: string;
  entries: BreakdownEntry[];
  toneOf?: (entry: BreakdownEntry) => BarTone;
  formatCount: (count: number) => string;
  emptyText: string;
}) => {
  const largest = Math.max(...entries.map(({ count }) => count), 1);

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {entries.length === 0 ? (
        <MutedText>{emptyText}</MutedText>
      ) : (
        <BreakdownList>
          {entries.map((entry) => (
            <BreakdownItem key={entry.key}>
              <BreakdownLabel>{entry.label}</BreakdownLabel>
              <BreakdownCount>{formatCount(entry.count)}</BreakdownCount>
              <BarCell>
                <ProgressBar percent={(entry.count / largest) * 100} tone={toneOf(entry)} label={entry.label} />
              </BarCell>
            </BreakdownItem>
          ))}
        </BreakdownList>
      )}
    </Card>
  );
};

export const BreakdownGrid = styled.div`
  display: grid;
  gap: ${() => themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
`;
