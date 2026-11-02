import { i18n } from '@lingui/core';
import {
  APP_LOCALES,
  getLocaleTextDirection,
  SOURCE_LOCALE,
} from 'twenty-shared/translations';

export const dynamicActivate = async (locale: keyof typeof APP_LOCALES) => {
  if (!Object.values(APP_LOCALES).includes(locale)) {
    // oxlint-disable-next-line no-console
    console.warn(`Invalid locale "${locale}", defaulting to "en"`);
    locale = SOURCE_LOCALE;
  }
  const { messages } = await import(`../../locales/generated/${locale}.ts`);
  i18n.load(locale, messages);
  i18n.activate(locale);

  try {
    // Lets the next pre-login boot (initialI18nActivate) reuse the member's locale
    localStorage.setItem('locale', locale);
  } catch {
    // storage unavailable (private mode); boot falls back to the browser language
  }

  document.documentElement.lang = locale;
  document.documentElement.dir = getLocaleTextDirection(locale);
};
