import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { getLocaleTextDirection } from 'twenty-shared/translations';
import { isDefined } from 'twenty-shared/utils';
import { Dialog } from 'twenty-ui/primitives/surfaces';
import { DialogInstance } from '@/ui/layout/dialog/components/DialogInstance';
import { styled } from '@linaria/react';

import { useSpreadsheetImportInternal } from '@/spreadsheet-import/hooks/useSpreadsheetImportInternal';

import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme';
import { SpreadSheetImportModalCloseButton } from './SpreadSheetImportModalCloseButton';

const StyledPopup = styled(Dialog.Popup)`
  height: ${themeCssVariables.modal.size.xl.height};
`;

const StyledInnerContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 600px;
  min-width: 800px;
  position: relative;
  @media (max-width: ${MOBILE_VIEWPORT}px) {
    min-width: auto;
    min-height: auto;
    width: 100%;
    height: 80%;
  }
`;

const StyledRtlLtr = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

type SpreadSheetImportModalWrapperProps = {
  children: React.ReactNode;
  modalInstanceId: string;
  onClose: () => void;
};

export const SpreadSheetImportModalWrapper = ({
  modalInstanceId,
  children,
  onClose,
}: SpreadSheetImportModalWrapperProps) => {
  const { rtl } = useSpreadsheetImportInternal();
  const { i18n } = useLingui();
  const direction = isDefined(rtl)
    ? rtl
      ? 'rtl'
      : 'ltr'
    : getLocaleTextDirection(i18n.locale);

  return (
    <DialogInstance
      dialogId={modalInstanceId}
      dismissible={true}
      onClose={onClose}
      closeOnDismiss={false}
    >
      {({ onKeyDown }) => (
        <StyledPopup
          aria-label={t`Import data`}
          onKeyDown={onKeyDown}
          size="xl"
        >
          <StyledInnerContainer>
            <StyledRtlLtr dir={direction}>
              <SpreadSheetImportModalCloseButton onClose={onClose} />
              {children}
            </StyledRtlLtr>
          </StyledInnerContainer>
        </StyledPopup>
      )}
    </DialogInstance>
  );
};
