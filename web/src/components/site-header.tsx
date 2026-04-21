import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { signOut } from "@/app/actions/auth";
import { ensureAndGetCurrentUserRole, isAdminRole } from "@/lib/admin";
import type { AppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LanguageSwitcher } from "@/components/language-switcher";

type SiteHeaderProps = {
  locale: string;
};

export async function SiteHeader({ locale }: SiteHeaderProps) {
  const typedLocale = locale as AppLocale;
  const supabase = await createServerSupabaseClient();
  const t = await getTranslations("common.nav");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let hasPostedListing = false;
  let isAdmin = false;

  if (user) {
    const [listingResponse, role] = await Promise.all([
      supabase.from("listings").select("id").eq("user_id", user.id).limit(1),
      ensureAndGetCurrentUserRole(supabase, user),
    ]);
    const { data: listingRows } = listingResponse;
    hasPostedListing = Boolean(listingRows?.length);
    isAdmin = isAdminRole(role);
  }

  return (
    <header className="border-b border-stone-200 bg-white/90">
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href={withLocalePath("/annonces", typedLocale)} className="inline-flex min-w-0 flex-1 items-center lg:flex-none">
          <Image
            src="/findmyrooom-logo.png"
            alt="FindMyRoom"
            width={1650}
            height={318}
            className="h-auto w-full max-w-[215px] sm:max-w-[220px]"
            sizes="(max-width: 640px) calc(100vw - 8rem), 220px"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-2 text-sm lg:flex">
          <Link href={withLocalePath("/annonces", typedLocale)} className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]">
            {t("annonces")}
          </Link>
          <Link href={withLocalePath("/deposer", typedLocale)} className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]">
            {t("deposer")}
          </Link>
          {user ? (
            <>
              <Link
                href={withLocalePath("/mes-annonces", typedLocale)}
                className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]"
              >
                {t("mesAnnonces")}
              </Link>
              {isAdmin ? (
                <Link href={withLocalePath("/clients", typedLocale)} className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]">
                  {t("clients")}
                </Link>
              ) : null}
              {hasPostedListing || isAdmin ? (
                <Link
                  href={withLocalePath("/statistiques", typedLocale)}
                  className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]"
                >
                  {t("statistiques")}
                </Link>
              ) : null}
              <LanguageSwitcher />
              <form action={signOut}>
                <button
                  type="submit"
                  className="cursor-pointer rounded-md border border-[#efc6c1] px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]"
                >
                  {t("deconnexion")}
                </button>
              </form>
            </>
          ) : (
            <>
              <LanguageSwitcher />
              <Link href={withLocalePath("/connexion", typedLocale)} className="btn btn-primary">
                {t("connexion")}
              </Link>
            </>
          )}
        </nav>

        <details className="shrink-0 lg:hidden">
          <summary className="inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700">
            ☰
          </summary>
          <div className="absolute left-0 right-0 top-[70px] z-20 border-y border-stone-200 bg-white px-4 py-3 shadow-sm">
            <div className="mb-3">
              <LanguageSwitcher />
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <Link href={withLocalePath("/annonces", typedLocale)} className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]">
                {t("annonces")}
              </Link>
              <Link href={withLocalePath("/deposer", typedLocale)} className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]">
                {t("deposer")}
              </Link>
              {user ? (
                <>
                  <Link
                    href={withLocalePath("/mes-annonces", typedLocale)}
                    className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]"
                  >
                    {t("mesAnnonces")}
                  </Link>
                  {isAdmin ? (
                    <Link href={withLocalePath("/clients", typedLocale)} className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]">
                      {t("clients")}
                    </Link>
                  ) : null}
                  {hasPostedListing || isAdmin ? (
                    <Link
                      href={withLocalePath("/statistiques", typedLocale)}
                      className="rounded-md px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]"
                    >
                      {t("statistiques")}
                    </Link>
                  ) : null}
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="mt-2 w-full cursor-pointer rounded-md border border-[#efc6c1] px-3 py-2 text-stone-700 hover:bg-[#fee9e6] hover:text-[#ba4d40]"
                    >
                      {t("deconnexion")}
                    </button>
                  </form>
                </>
              ) : (
                <Link href={withLocalePath("/connexion", typedLocale)} className="btn btn-primary mt-2 w-full justify-center">
                  {t("connexion")}
                </Link>
              )}
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
