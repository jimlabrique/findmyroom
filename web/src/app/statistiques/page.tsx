import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { getAdminUsers } from "@/lib/data/admin";
import { getListingMetricsByListingIds, getOwnerListingMetrics } from "@/lib/data/listing-events";
import { getAllListingsForAdmin, getOwnerListings } from "@/lib/data/listings";
import { listingStatusLabel } from "@/lib/listing";
import type { AppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";

export const dynamic = "force-dynamic";

function formatPercent(value: number, locale: AppLocale) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-BE" : locale === "nl" ? "nl-BE" : "en-GB", {
    style: "percent",
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value / 100);
}

type KpiCardProps = {
  label: string;
  value: string;
  hint: string;
};

function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <article className="panel space-y-1 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="font-serif text-3xl text-stone-900">{value}</p>
      <p className="text-xs text-stone-500">{hint}</p>
    </article>
  );
}

export default async function StatistiquesPage() {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("stats");
  const tStatus = await getTranslations("status");
  const { user, isAdmin } = await requireUser(withLocalePath("/statistiques", locale));

  if (isAdmin) {
    let listings = [] as Awaited<ReturnType<typeof getAllListingsForAdmin>>;
    let appUsers = [] as Awaited<ReturnType<typeof getAdminUsers>>;
    try {
      [listings, appUsers] = await Promise.all([getAllListingsForAdmin(), getAdminUsers()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("adminLoadError");
      return (
        <div className="container-page max-w-4xl space-y-4">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{t("adminTag")}</p>
            <h1 className="font-serif text-4xl text-stone-900">{t("adminTitle")}</h1>
          </header>
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>
        </div>
      );
    }
    const metricsByListingId = await getListingMetricsByListingIds(listings.map((listing) => listing.id));
    const emailByUserId = new Map(appUsers.map((appUser) => [appUser.id, appUser.email ?? "-"]));

    const activeListings = listings.filter((listing) => listing.status === "active").length;
    const totalViews = listings.reduce((sum, listing) => sum + (metricsByListingId.get(listing.id)?.views ?? 0), 0);
    const totalContacts = listings.reduce((sum, listing) => sum + (metricsByListingId.get(listing.id)?.contacts ?? 0), 0);
    const clickThroughRate = totalViews > 0 ? (totalContacts / totalViews) * 100 : 0;

    const topListings = listings
      .map((listing) => {
        const metrics = metricsByListingId.get(listing.id) ?? { views: 0, contacts: 0 };
        const listingCtr = metrics.views > 0 ? (metrics.contacts / metrics.views) * 100 : 0;
        return {
          id: listing.id,
          slug: listing.slug,
          title: listing.title,
          city: listing.city,
          ownerEmail: emailByUserId.get(listing.user_id) ?? "-",
          statusLabel: listingStatusLabel(listing) as "active" | "paused" | "archived" | "expired",
          views: metrics.views,
          contacts: metrics.contacts,
          ctr: listingCtr,
        };
      })
      .sort((a, b) => {
        if (b.contacts !== a.contacts) return b.contacts - a.contacts;
        return b.views - a.views;
      })
      .slice(0, 20);

    return (
      <div className="container-page max-w-6xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{t("adminTag")}</p>
          <h1 className="font-serif text-4xl text-stone-900">{t("adminTitle")}</h1>
          <p className="text-stone-700">{t("adminSubtitle")}</p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label={t("usersLabel")} value={`${appUsers.length}`} hint={t("usersHint")} />
          <KpiCard label={t("activeListingsLabel")} value={`${activeListings}`} hint={t("activeListingsHint")} />
          <KpiCard label={t("totalListingsLabel")} value={`${listings.length}`} hint={t("totalListingsHint")} />
          <KpiCard label={t("viewsLabel")} value={`${totalViews}`} hint={t("viewsHint")} />
          <KpiCard label={t("contactsLabel")} value={`${totalContacts}`} hint={t("contactsHint")} />
        </section>

        <section className="panel space-y-4 p-5">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-serif text-2xl text-stone-900">{t("platformTopTitle")}</h2>
            <p className="text-sm text-stone-500">{t("globalCtr", { value: formatPercent(clickThroughRate, locale) })}</p>
          </div>

          {topListings.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-stone-500">
                  <tr>
                    <th className="pb-2 pr-3 font-medium">{t("tableListing")}</th>
                    <th className="pb-2 pr-3 font-medium">{t("tableClient")}</th>
                    <th className="pb-2 pr-3 font-medium">{t("tableCity")}</th>
                    <th className="pb-2 pr-3 font-medium">{t("tableStatus")}</th>
                    <th className="pb-2 pr-3 font-medium">{t("tableViews")}</th>
                    <th className="pb-2 pr-3 font-medium">{t("tableContacts")}</th>
                    <th className="pb-2 pr-3 font-medium">{t("tableCtr")}</th>
                  </tr>
                </thead>
                <tbody className="text-stone-800">
                  {topListings.map((listing) => (
                    <tr key={listing.id} className="border-t border-stone-100">
                      <td className="py-2 pr-3">
                        <Link href={withLocalePath(`/annonces/${listing.slug}`, locale)} className="font-medium link-brand">
                          {listing.title}
                        </Link>
                      </td>
                      <td className="py-2 pr-3">{listing.ownerEmail}</td>
                      <td className="py-2 pr-3">{listing.city}</td>
                      <td className="py-2 pr-3">{tStatus(listing.statusLabel)}</td>
                      <td className="py-2 pr-3">{listing.views}</td>
                      <td className="py-2 pr-3">{listing.contacts}</td>
                      <td className="py-2 pr-3">{formatPercent(listing.ctr, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm text-stone-700">{t("platformEmpty")}</p>
            </div>
          )}
        </section>
      </div>
    );
  }

  const listings = await getOwnerListings(user.id);
  if (!listings.length) {
    redirect(withLocalePath("/deposer", locale));
  }
  const metricsByListingId = await getOwnerListingMetrics(listings.map((listing) => listing.id));

  const activeListings = listings.filter((listing) => listing.status === "active").length;
  const totalViews = listings.reduce((sum, listing) => sum + (metricsByListingId.get(listing.id)?.views ?? 0), 0);
  const totalContacts = listings.reduce((sum, listing) => sum + (metricsByListingId.get(listing.id)?.contacts ?? 0), 0);
  const clickThroughRate = totalViews > 0 ? (totalContacts / totalViews) * 100 : 0;

  const topListings = listings
    .map((listing) => {
      const metrics = metricsByListingId.get(listing.id) ?? { views: 0, contacts: 0 };
      const listingCtr = metrics.views > 0 ? (metrics.contacts / metrics.views) * 100 : 0;
      return {
        id: listing.id,
        slug: listing.slug,
        title: listing.title,
        city: listing.city,
        views: metrics.views,
        contacts: metrics.contacts,
        ctr: listingCtr,
      };
    })
    .sort((a, b) => {
      if (b.contacts !== a.contacts) return b.contacts - a.contacts;
      return b.views - a.views;
    })
    .slice(0, 5);

  return (
    <div className="container-page max-w-5xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{t("userTag")}</p>
        <h1 className="font-serif text-4xl text-stone-900">{t("userTitle")}</h1>
        <p className="text-stone-700">{t("userSubtitle")}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t("activeListingsLabel")} value={`${activeListings}`} hint={t("activeListingsHint")} />
        <KpiCard label={t("viewsLabel")} value={`${totalViews}`} hint={t("viewsHint")} />
        <KpiCard label={t("contactsLabel")} value={`${totalContacts}`} hint={t("contactsHint")} />
        <KpiCard label={t("conversionLabel")} value={formatPercent(clickThroughRate, locale)} hint={t("conversionHint")} />
      </section>

      <section className="panel space-y-4 p-5">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-serif text-2xl text-stone-900">{t("topTitle")}</h2>
          <Link href={withLocalePath("/mes-annonces", locale)} className="text-sm font-medium link-brand">
            {t("manageListings")}
          </Link>
        </div>

        {topListings.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-stone-500">
                <tr>
                  <th className="pb-2 pr-3 font-medium">{t("tableListing")}</th>
                  <th className="pb-2 pr-3 font-medium">{t("tableCity")}</th>
                  <th className="pb-2 pr-3 font-medium">{t("tableViews")}</th>
                  <th className="pb-2 pr-3 font-medium">{t("tableContacts")}</th>
                  <th className="pb-2 pr-3 font-medium">{t("tableCtr")}</th>
                </tr>
              </thead>
              <tbody className="text-stone-800">
                {topListings.map((listing) => (
                  <tr key={listing.id} className="border-t border-stone-100">
                    <td className="py-2 pr-3">
                      <Link href={withLocalePath(`/annonces/${listing.slug}`, locale)} className="font-medium link-brand">
                        {listing.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{listing.city}</td>
                    <td className="py-2 pr-3">{listing.views}</td>
                    <td className="py-2 pr-3">{listing.contacts}</td>
                    <td className="py-2 pr-3">{formatPercent(listing.ctr, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm text-stone-700">{t("ownerEmpty")}</p>
            <Link href={withLocalePath("/deposer", locale)} className="btn btn-primary">
              {t("createListing")}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
