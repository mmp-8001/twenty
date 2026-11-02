import { useLingui } from '@lingui/react/macro';
import { useRecordBoardCardNavigation } from '@/object-record/record-board/hooks/useRecordBoardCardNavigation';
import { useHotkeysOnFocusedElement } from '@/ui/utilities/hotkey/hooks/useHotkeysOnFocusedElement';
import { Key } from 'ts-key-enum';
import { getLocaleTextDirection } from 'twenty-shared/translations';

export const useRecordBoardArrowKeysEffect = ({
  recordBoardId,
  focusId,
}: {
  recordBoardId: string;
  focusId: string;
}) => {
  const { move } = useRecordBoardCardNavigation(recordBoardId);

  const { i18n } = useLingui();
  const isRtl = getLocaleTextDirection(i18n.locale) === 'rtl';

  useHotkeysOnFocusedElement({
    keys: [Key.ArrowLeft],
    callback: () => move(isRtl ? 'right' : 'left'),
    focusId,
    dependencies: [move, isRtl],
  });

  useHotkeysOnFocusedElement({
    keys: [Key.ArrowRight],
    callback: () => move(isRtl ? 'left' : 'right'),
    focusId,
    dependencies: [move, isRtl],
  });

  useHotkeysOnFocusedElement({
    keys: [Key.ArrowUp],
    callback: () => move('up'),
    focusId,
    dependencies: [move],
  });

  useHotkeysOnFocusedElement({
    keys: [Key.ArrowDown],
    callback: () => move('down'),
    focusId,
    dependencies: [move],
  });
};
