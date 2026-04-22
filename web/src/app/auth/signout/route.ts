import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_LOCALE, LOCALE_HEADER, normalizeLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";
import { isTrustedRequestHeaders } from "@/lib/security/request";

function hasTrustHeaders(request: Request) {
  const origin = `${request.headers.get("origin") ?? ""}`.trim();
  const referer = `${request.headers.get("referer") ?? ""}`.trim();
  const fetchSite = `${request.headers.get("sec-fetch-site") ?? ""}`.trim();
  return Boolean(origin || referer || fetchSite);
}

export async function POST(request: Request) {
  const locale = normalizeLocale(request.headers.get(LOCALE_HEADER) ?? DEFAULT_LOCALE);
  const annoncesPath = withLocalePath("/annonces", locale);

  if (hasTrustHeaders(request) && !isTrustedRequestHeaders(request.headers)) {
    return new NextResponse(null, {
      status: 303,
      headers: {
        Location: annoncesPath,
      },
    });
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: annoncesPath,
    },
  });
}
