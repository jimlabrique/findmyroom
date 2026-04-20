import { DEFAULT_LOCALE, isSupportedLocale, type AppLocale } from "@/lib/i18n/locales";

function normalizePath(path: string) {
  if (!path.startsWith("/")) return `/${path}`;
  return path;
}

export function stripLocalePrefix(path: string) {
  const normalizedPath = normalizePath(path);
  const segments = normalizedPath.split("/").filter(Boolean);
  const first = segments[0];
  if (!isSupportedLocale(first)) {
    return normalizedPath;
  }
  const stripped = `/${segments.slice(1).join("/")}`;
  return stripped === "/" ? "/" : stripped.replace(/\/+$/, "") || "/";
}

export function pathLocale(path: string): AppLocale | null {
  const normalizedPath = normalizePath(path);
  const first = normalizedPath.split("/").filter(Boolean)[0] ?? "";
  return isSupportedLocale(first) ? first : null;
}

export function withLocalePath(path: string, locale: AppLocale = DEFAULT_LOCALE) {
  const stripped = stripLocalePrefix(path);
  if (stripped === "/") {
    return `/${locale}`;
  }
  return `/${locale}${stripped}`;
}

export function replacePathLocale(path: string, locale: AppLocale) {
  return withLocalePath(path, locale);
}
