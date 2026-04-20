import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER, normalizeLocale, type AppLocale } from "@/lib/i18n/locales";

export async function getRequestLocale(): Promise<AppLocale> {
  const headerStore = await headers();
  const localeFromHeader = headerStore.get(LOCALE_HEADER);
  if (localeFromHeader) {
    return normalizeLocale(localeFromHeader);
  }

  const cookieStore = await cookies();
  const localeFromCookie = cookieStore.get(LOCALE_COOKIE)?.value ?? null;
  if (localeFromCookie) {
    return normalizeLocale(localeFromCookie);
  }

  const acceptLanguage = headerStore.get("accept-language");
  if (acceptLanguage) {
    return normalizeLocale(acceptLanguage.split(",")[0] ?? DEFAULT_LOCALE);
  }

  return DEFAULT_LOCALE;
}
