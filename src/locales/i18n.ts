import { en } from "@/locales/en";
import { es } from "@/locales/es";
import { ca } from "@/locales/ca";
import { fr } from "@/locales/fr";
import { de } from "@/locales/de";
import { it } from "@/locales/it";
import { pt } from "@/locales/pt";
import { nl } from "@/locales/nl";
import { pl } from "@/locales/pl";
import { ro } from "@/locales/ro";
import { ru } from "@/locales/ru";
import { ja } from "@/locales/ja";
import type { LocaleDictionary } from "@/locales/en";

export const LOCALE_CODES = [
  "en",
  "es",
  "ca",
  "fr",
  "de",
  "it",
  "pt",
  "nl",
  "pl",
  "ro",
  "ru",
  "ja",
] as const;

export type LocaleCode = (typeof LOCALE_CODES)[number];

export const DEFAULT_LOCALE: LocaleCode = "en";

export const LOCALE_NAMES: Record<LocaleCode, string> = {
  en: "English",
  es: "Español",
  ca: "Català",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  ro: "Română",
  ru: "Русский",
  ja: "日本語",
};

const DICTIONARIES: Record<LocaleCode, LocaleDictionary> = {
  en,
  es,
  ca,
  fr,
  de,
  it,
  pt,
  nl,
  pl,
  ro,
  ru,
  ja,
};

export function getDictionary(locale: LocaleCode): LocaleDictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}
