import { redirect } from "next/navigation";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { withLocalePath } from "@/lib/i18n/pathname";

export const dynamic = "force-dynamic";

export default async function Home() {
  const locale = await getRequestLocale();
  redirect(withLocalePath("/annonces", locale));
}
