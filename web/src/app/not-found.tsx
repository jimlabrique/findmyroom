import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";

export default async function NotFound() {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("notFound");

  return (
    <div className="container-page">
      <div className="panel space-y-4 p-8 text-center">
        <h1 className="font-serif text-4xl text-stone-900">{t("title")}</h1>
        <p className="text-stone-700">{t("description")}</p>
        <div className="flex justify-center gap-3">
          <Link href={withLocalePath("/annonces", locale)} className="btn btn-primary">
            {t("backToListings")}
          </Link>
          <Link href={withLocalePath("/annonces", locale)} className="btn btn-ghost">
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
