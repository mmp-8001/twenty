import { getLocaleTextDirection } from 'twenty-shared/translations';

import { dateLocaleState } from '~/localization/states/dateLocaleState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Reactive direction of the active UI locale, for the JS-level decisions that
// CSS auto-flip cannot reach. dateLocaleState.locale is the same source the
// formatters read, so this stays in sync with <html dir>.
export const useTextDirection = () => {
  const { locale } = useAtomStateValue(dateLocaleState);

  return locale ? getLocaleTextDirection(locale) : 'ltr';
};
