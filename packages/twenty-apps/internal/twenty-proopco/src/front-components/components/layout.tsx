import styled from '@emotion/styled';
import { themeCssVariables } from 'twenty-ui/theme';

export const Page = styled.div`
  box-sizing: border-box;
  color: ${() => themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  font-family: ${() => themeCssVariables.font.family};
  font-size: ${() => themeCssVariables.font.size.md};
  gap: ${() => themeCssVariables.spacing[4]};
  padding: ${() => themeCssVariables.spacing[4]};
  width: 100%;
`;

export const Row = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${() => themeCssVariables.spacing[2]};
`;

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[2]};
`;

export const SectionTitle = styled.h3`
  color: ${() => themeCssVariables.font.color.primary};
  font-size: ${() => themeCssVariables.font.size.lg};
  font-weight: ${() => themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

export const MutedText = styled.span`
  color: ${() => themeCssVariables.font.color.tertiary};
  font-size: ${() => themeCssVariables.font.size.sm};
`;

export const StatGrid = styled.div`
  display: grid;
  gap: ${() => themeCssVariables.spacing[2]};
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
`;

export const StatCard = styled.div`
  background: ${() => themeCssVariables.background.secondary};
  border: 1px solid ${() => themeCssVariables.border.color.light};
  border-radius: ${() => themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[1]};
  padding: ${() => themeCssVariables.spacing[3]};
`;

export const StatValue = styled.span`
  color: ${() => themeCssVariables.font.color.primary};
  font-size: ${() => themeCssVariables.font.size.xl};
  font-weight: ${() => themeCssVariables.font.weight.semiBold};
`;

export const Card = styled.div`
  background: ${() => themeCssVariables.background.primary};
  border: 1px solid ${() => themeCssVariables.border.color.medium};
  border-radius: ${() => themeCssVariables.border.radius.md};
  padding: ${() => themeCssVariables.spacing[3]};
`;

export const TableWrapper = styled.div`
  border: 1px solid ${() => themeCssVariables.border.color.light};
  border-radius: ${() => themeCssVariables.border.radius.md};
  overflow-x: auto;
`;

export const Table = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

export const HeaderCell = styled.th`
  background: ${() => themeCssVariables.background.secondary};
  border-block-end: 1px solid ${() => themeCssVariables.border.color.light};
  color: ${() => themeCssVariables.font.color.tertiary};
  font-size: ${() => themeCssVariables.font.size.sm};
  font-weight: ${() => themeCssVariables.font.weight.medium};
  padding: ${() => themeCssVariables.spacing[2]} ${() => themeCssVariables.spacing[3]};
  text-align: start;
  white-space: nowrap;
`;

export const Cell = styled.td`
  border-block-end: 1px solid ${() => themeCssVariables.border.color.light};
  color: ${() => themeCssVariables.font.color.secondary};
  font-size: ${() => themeCssVariables.font.size.sm};
  padding: ${() => themeCssVariables.spacing[2]} ${() => themeCssVariables.spacing[3]};
  text-align: start;
  vertical-align: middle;
`;

// Keeps "3 / 5 (60%)" in reading order inside a right-to-left row.
export const NumericValue = styled.span`
  direction: ltr;
  display: inline-block;
  unicode-bidi: isolate;
`;

export const NameLink = styled.a`
  color: ${() => themeCssVariables.font.color.primary};
  font-weight: ${() => themeCssVariables.font.weight.medium};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export const FieldLabel = styled.label`
  color: ${() => themeCssVariables.font.color.secondary};
  font-size: ${() => themeCssVariables.font.size.sm};
  font-weight: ${() => themeCssVariables.font.weight.medium};
`;

const fieldStyles = `
  box-sizing: border-box;
  font: inherit;
  font-size: inherit;
  width: 100%;
`;

export const TextInput = styled.input`
  ${fieldStyles}
  background: ${() => themeCssVariables.background.transparent.lighter};
  border: 1px solid ${() => themeCssVariables.border.color.medium};
  border-radius: ${() => themeCssVariables.border.radius.sm};
  color: ${() => themeCssVariables.font.color.primary};
  padding: ${() => themeCssVariables.spacing[2]};
  &:focus {
    border-color: ${() => themeCssVariables.color.blue};
    outline: none;
  }
`;

export const SelectInput = TextInput.withComponent('select');
export const TextArea = styled(TextInput.withComponent('textarea'))`
  min-height: 80px;
  resize: vertical;
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[1]};
`;

export const CheckboxRow = styled.label`
  align-items: center;
  color: ${() => themeCssVariables.font.color.secondary};
  display: flex;
  font-size: ${() => themeCssVariables.font.size.sm};
  gap: ${() => themeCssVariables.spacing[2]};
`;

export const Overlay = styled.div`
  align-items: center;
  background: ${() => themeCssVariables.background.overlayPrimary};
  display: flex;
  inset: 0;
  justify-content: center;
  position: fixed;
  z-index: 10;
`;

// Narrow widgets (record page columns) stack their rows instead of using a table.
export const ItemList = styled.div`
  border: 1px solid ${() => themeCssVariables.border.color.light};
  border-radius: ${() => themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
`;

export const Item = styled.div`
  border-block-end: 1px solid ${() => themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${() => themeCssVariables.spacing[1]};
  padding: ${() => themeCssVariables.spacing[2]} ${() => themeCssVariables.spacing[3]};
  &:last-child {
    border-block-end: none;
  }
`;
