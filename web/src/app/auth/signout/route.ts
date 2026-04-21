import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_LOCALE, LOCALE_HEADER, normalizeLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";

export async function POST(request: Request) {
  const locale = normalizeLocale(request.headers.get(LOCALE_HEADER) ?? DEFAULT_LOCALE);
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: withLocalePath("/annonces", locale),
    },
  });
}
