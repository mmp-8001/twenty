import { useMemo } from 'react';

import { dateLocaleState } from '~/localization/states/dateLocaleState';
import { workspaceMemberFormatPreferencesState } from '@/localization/states/workspaceMemberFormatPreferencesState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import {
  formatNumber as utilFormatNumber,
  type FormatNumberOptions,
} from '~/utils/format/formatNumber';

export const useNumberFormat = () => {
  const workspaceMemberFormatPreferences = useAtomStateValue(
    workspaceMemberFormatPreferencesState,
  );

  // Same source the date formatters read, so digits stay consistent across
  // dates and numbers.
  const { locale: uiLocale } = useAtomStateValue(dateLocaleState);

  const formatNumber = useMemo(
    () =>
      (
        value: number,
        options?: Omit<FormatNumberOptions, 'format'>,
      ): string => {
        return utilFormatNumber(value, {
          format: workspaceMemberFormatPreferences.numberFormat,
          uiLocale: uiLocale ?? '',
          ...options,
        });
      },
    [workspaceMemberFormatPreferences.numberFormat, uiLocale],
  );

  return {
    formatNumber,
    numberFormat: workspaceMemberFormatPreferences.numberFormat,
  };
};
