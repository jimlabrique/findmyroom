"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { replacePathLocale } from "@/lib/i18n/pathname";
import { SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/locales";

const LANGUAGE_OPTIONS: ReadonlyArray<{ code: AppLocale; flag: string }> = [
  { code: "fr", flag: "🇫🇷" },
  { code: "en", flag: "🇬🇧" },
  { code: "nl", flag: "🇳🇱" },
];

export function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const locale = useLocale() as AppLocale;
  const t = useTranslations("common.language");

  function onChange(nextLocale: AppLocale) {
    const normalized = SUPPORTED_LOCALES.includes(nextLocale as AppLocale) ? (nextLocale as AppLocale) : locale;
    if (normalized === locale) {
      return;
    }
    const targetPath = replacePathLocale(pathname, normalized);
    const queryString = searchParams.toString();
    const targetUrl = queryString ? `${targetPath}?${queryString}` : targetPath;
    window.location.assign(targetUrl);
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-stone-300 bg-white p-1" role="group" aria-label={t("label")}>
      {LANGUAGE_OPTIONS.map((option) => {
        const active = locale === option.code;
        return (
          <button
            key={option.code}
            type="button"
            onClick={() => onChange(option.code)}
            aria-label={`${t("label")}: ${t(option.code)}`}
            title={t(option.code)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-base leading-none transition ${
              active ? "bg-[#ee7768]/15 text-[#ba4d40]" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <span aria-hidden="true">{option.flag}</span>
          </button>
        );
      })}
    </div>
  );
}
