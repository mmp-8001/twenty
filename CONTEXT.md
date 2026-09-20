# Twenty

An open-source CRM. This fork adds Persian (`fa`) as a right-to-left locale alongside English.

## Language

### Localization

**App locale**:
A locale Twenty can run in, listed in `APP_LOCALES` in `twenty-shared`. Adding one there forces every consumer (catalogs, pickers, date locales) to handle it via exhaustive `Record` types.
_Avoid_: language, translation

**Source locale**:
The locale UI strings are authored in (`en`). Every other locale falls back to it per-string when a translation is absent.
_Avoid_: default locale, base language

**Locale availability**:
Whether a locale can be selected and has strings: an entry in `APP_LOCALES`, a catalog, a picker label. Distinct from whether the app is laid out correctly in it.
_Avoid_: locale support

**Direction correctness**:
Whether the layout actually mirrors in a right-to-left locale: CSS sides, icon geometry, popover placement, drag axes. A locale can be fully available and still directionally wrong.
_Avoid_: RTL support

**Auto-flip**:
Generating `[dir="rtl"]` CSS overrides at build time from the existing physical declarations, rather than migrating the source to logical properties. See ADR-0001.

**Translation glossary**:
The frozen English-to-Persian renderings of recurring domain nouns (`record` → `رکورد`) injected into every machine-translation batch, so separate translation runs agree on wording. Not to be confused with this file.

**Jalali display**:
Rendering dates in the Persian (Shamsi) calendar. Display only in this fork: date *input* and the picker grid remain Gregorian.
_Avoid_: Shamsi, Persian calendar

**Persian digits**:
The Persian-Indic numerals (`۰`–`۹`) substituted for ASCII digits at the display layer, after formatting.
_Avoid_: Arabic numerals, Eastern digits
