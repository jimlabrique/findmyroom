import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { pathLocale, withLocalePath } from "@/lib/i18n/pathname";

function cookieLocale(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const localeToken = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("FMR_LOCALE="));
  if (!localeToken) return DEFAULT_LOCALE;
  const value = localeToken.split("=")[1] ?? "";
  return value === "fr" || value === "en" || value === "nl" ? value : DEFAULT_LOCALE;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";
  const safeRawNext = next.startsWith("/") ? next : "/";
  const locale = pathLocale(safeRawNext) ?? cookieLocale(request);
  const safeNext = pathLocale(safeRawNext) ? safeRawNext : withLocalePath(safeRawNext, locale);

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
