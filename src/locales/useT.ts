import { useCallback } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { getDictionary } from "@/locales/i18n";
import type { LocaleKey } from "@/locales/en";

export type TranslateFn = (key: LocaleKey) => string;

export function useT(): TranslateFn {
  const locale = useSettingsStore((state) => state.locale);
  const dictionary = getDictionary(locale);

  return useCallback((key: LocaleKey) => dictionary[key], [dictionary]);
}
