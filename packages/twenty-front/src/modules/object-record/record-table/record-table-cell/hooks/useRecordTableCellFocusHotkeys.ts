import { useLingui } from '@lingui/react/macro';
import { useRecordTableContextOrThrow } from '@/object-record/record-table/contexts/RecordTableContext';
import { useRecordTableMoveFocusedCell } from '@/object-record/record-table/hooks/useRecordTableMoveFocusedCell';
import { useHotkeysOnFocusedElement } from '@/ui/utilities/hotkey/hooks/useHotkeysOnFocusedElement';
import { Key } from 'ts-key-enum';
import { getLocaleTextDirection } from 'twenty-shared/translations';

export const useRecordTableCellFocusHotkeys = ({
  focusId,
}: {
  focusId: string;
}) => {
  const { recordTableId } = useRecordTableContextOrThrow();

  const { moveFocus } = useRecordTableMoveFocusedCell(recordTableId);

  const { i18n } = useLingui();
  const isRtl = getLocaleTextDirection(i18n.locale) === 'rtl';

  useHotkeysOnFocusedElement({
    keys: [Key.ArrowUp],
    callback: () => {
      moveFocus('up');
    },
    focusId,
    dependencies: [moveFocus],
  });

  useHotkeysOnFocusedElement({
    keys: [Key.ArrowDown],
    callback: () => {
      moveFocus('down');
    },
    focusId,
    dependencies: [moveFocus],
  });

  useHotkeysOnFocusedElement({
    keys: [Key.ArrowLeft],
    callback: () => {
      moveFocus(isRtl ? 'right' : 'left');
    },
    focusId,
    dependencies: [moveFocus, isRtl],
  });

  useHotkeysOnFocusedElement({
    keys: [Key.ArrowRight],
    callback: () => {
      moveFocus(isRtl ? 'left' : 'right');
    },
    focusId,
    dependencies: [moveFocus, isRtl],
  });
};
