import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth";
import { getOwnerListings } from "@/lib/data/listings";
import { getOwnerListingMetrics } from "@/lib/data/listing-events";
import { deleteAccountAction, deleteListingAction, updateListingStatusAction } from "@/app/mes-annonces/actions";
import type { AppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";
import { listingStatusLabel, listingTypeLabel } from "@/lib/listing";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

type MyListingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

function nextStatus(status: "active" | "paused" | "archived") {
  if (status === "active") return "paused";
  if (status === "paused") return "active";
  return "active";
}

function humanizeMyListingsError(errorCode: string | null) {
  if (!errorCode) return null;
  return errorCode;
}

export default async function MyListingsPage({ searchParams }: MyListingsPageProps) {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("myListings");
  const tStatus = await getTranslations("status");
  const { user } = await requireUser(withLocalePath("/mes-annonces", locale));
  const query = await searchParams;
  const updated = query.updated === "1";
  const deleted = query.deleted === "1";
  const errorCode = typeof query.error === "string" ? query.error : null;
  const error = errorCode === "account_delete_not_configured" ? t("accountDeleteNotConfigured") : humanizeMyListingsError(errorCode);

  const listings = await getOwnerListings(user.id);
  const metricsByListingId = await getOwnerListingMetrics(listings.map((listing) => listing.id));

  return (
    <div className="container-page max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{t("tag")}</p>
          <h1 className="font-serif text-4xl text-stone-900">{t("title")}</h1>
        </div>
        <Link href={withLocalePath("/deposer", locale)} className="btn btn-primary">
          {t("newListing")}
        </Link>
      </header>

      {updated ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {t("updated")}
        </p>
      ) : null}
      {deleted ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {t("deleted")}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("errorPrefix")}: {error}
        </p>
      ) : null}

      {listings.length ? (
        <div className="space-y-4">
          {listings.map((listing) => {
            const statusToggle = nextStatus(listing.status as "active" | "paused" | "archived");
            const metrics = metricsByListingId.get(listing.id) ?? { views: 0, contacts: 0 };
            const statusLabel = listingStatusLabel(listing) as "active" | "paused" | "archived" | "expired";
            const expiresAtLabel = typeof listing.expires_at === "string" ? listing.expires_at : t("undefinedDate");
            return (
              <article key={listing.id} className="panel space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-stone-900">{listing.title}</h2>
                    <p className="text-sm text-stone-600">
                      {listing.city} • {listingTypeLabel(listing.listing_type, locale)} • {listing.rent_eur} EUR •{" "}
                      {t("roomsCount", { count: listing.available_rooms })}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {t("expiresOn", { date: expiresAtLabel })} • {t("views", { count: metrics.views })} •{" "}
                      {t("contacts", { count: metrics.contacts })}
                    </p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-stone-700">
                    {tStatus(statusLabel)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={withLocalePath(`/annonces/${listing.slug}`, locale)} className="btn btn-ghost">
                    {t("view")}
                  </Link>
                  <Link href={withLocalePath(`/mes-annonces/${listing.id}/editer`, locale)} className="btn btn-ghost">
                    {t("edit")}
                  </Link>
                  <form action={updateListingStatusAction}>
                    <input type="hidden" name="listing_id" value={listing.id} />
                    <input type="hidden" name="status" value={statusToggle} />
                    <button type="submit" className="btn btn-ghost">
                      {statusToggle === "paused" ? t("pause") : t("reactivate")}
                    </button>
                  </form>
                  {listing.status !== "archived" ? (
                    <form action={updateListingStatusAction}>
                      <input type="hidden" name="listing_id" value={listing.id} />
                      <input type="hidden" name="status" value="archived" />
                      <button type="submit" className="btn btn-ghost">
                        {t("archive")}
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteListingAction}>
                    <input type="hidden" name="listing_id" value={listing.id} />
                    <ConfirmSubmitButton
                      label={t("deletePermanent")}
                      confirmMessage={t("deletePermanentConfirm")}
                      className="btn btn-ghost border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                    />
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="panel p-6 text-stone-700">{t("empty")}</div>
      )}

      <section className="panel space-y-3 border-red-200 p-5">
        <h2 className="text-lg font-semibold text-red-700">{t("dangerTitle")}</h2>
        <p className="text-sm text-stone-700">
          {t("dangerDescription")}
        </p>
        <form action={deleteAccountAction}>
          <ConfirmSubmitButton
            label={t("deleteAccount")}
            confirmMessage={t("deleteAccountConfirm")}
            className="btn btn-ghost border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
          />
        </form>
      </section>
    </div>
  );
}
