import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";

type SiteFooterProps = {
  locale: AppLocale;
};

export async function SiteFooter({ locale }: SiteFooterProps) {
  const t = await getTranslations("common.footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200 bg-[#fffdf8]">
      <div className="container-page flex flex-col gap-3 py-5 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href={withLocalePath("/cgu", locale)} className="link-brand text-sm">
            {t("terms")}
          </Link>
          <Link href={withLocalePath("/confidentialite", locale)} className="link-brand text-sm">
            {t("privacy")}
          </Link>
          <a href="mailto:jim@la-brique.be" className="link-brand text-sm">
            {t("contact")}
          </a>
        </div>

        <p className="text-xs text-stone-500">{t("publisher", { year })}</p>
      </div>
    </footer>
  );
}
