"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { replacePathLocale } from "@/lib/i18n/pathname";
import { SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/locales";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale() as AppLocale;
  const t = useTranslations("common.language");

  function onChange(nextLocale: string) {
    const normalized = SUPPORTED_LOCALES.includes(nextLocale as AppLocale) ? (nextLocale as AppLocale) : locale;
    const targetPath = replacePathLocale(pathname, normalized);
    const queryString = searchParams.toString();
    router.push(queryString ? `${targetPath}?${queryString}` : targetPath);
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-stone-700">
      <span className="hidden sm:inline">{t("label")}</span>
      <select
        className="rounded-md border border-stone-300 bg-white px-2 py-1 text-sm text-stone-700"
        value={locale}
        onChange={(event) => onChange(event.currentTarget.value)}
        aria-label={t("label")}
      >
        <option value="fr">{t("fr")}</option>
        <option value="en">{t("en")}</option>
        <option value="nl">{t("nl")}</option>
      </select>
    </label>
  );
}
