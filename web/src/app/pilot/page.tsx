import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { AppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";

export const dynamic = "force-dynamic";

export default async function LegacyStatsRedirectPage() {
  const locale = (await getLocale()) as AppLocale;
  redirect(withLocalePath("/statistiques", locale));
}
