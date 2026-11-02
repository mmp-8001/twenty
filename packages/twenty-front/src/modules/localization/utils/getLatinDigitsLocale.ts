import { i18n } from '@lingui/core';
import { SOURCE_LOCALE } from 'twenty-shared/translations';

export const getLatinDigitsLocale = () =>
  `${i18n.locale || SOURCE_LOCALE}-u-nu-latn`;
