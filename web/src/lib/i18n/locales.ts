export const SUPPORTED_LOCALES = ["fr", "en", "nl"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "fr";
export const LOCALE_COOKIE = "FMR_LOCALE";
export const LOCALE_HEADER = "x-fmr-locale";

export function isSupportedLocale(value: string | null | undefined): value is AppLocale {
  if (!value) return false;
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (!value) return DEFAULT_LOCALE;
  const lower = value.trim().toLowerCase();
  if (isSupportedLocale(lower)) return lower;
  if (lower.startsWith("fr")) return "fr";
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("nl") || lower.startsWith("nl-be")) return "nl";
  return DEFAULT_LOCALE;
}
