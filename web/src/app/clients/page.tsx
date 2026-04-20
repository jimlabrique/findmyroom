import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { adminModerateListingStatusAction, adminSetUserRoleAction } from "@/app/clients/actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminClients, type AdminClient } from "@/lib/data/admin";
import type { AppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";
import { listingStatusLabel } from "@/lib/listing";

type ClientsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

function formatDate(value: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-BE" : locale === "nl" ? "nl-BE" : "en-GB", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function roleClassName(role: "user" | "admin" | "super_admin") {
  const className =
    role === "super_admin"
      ? "border border-[#e8b0aa] bg-[#fee9e6] text-[#ba4d40]"
      : role === "admin"
        ? "border border-[#edc2bd] bg-[#fff3f1] text-[#c3574a]"
        : "bg-stone-100 text-stone-700";
  return `rounded-full px-3 py-1 text-xs font-semibold ${className}`;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("clients");
  const tStatus = await getTranslations("status");
  const humanizeError = (errorCode: string | null) => {
    if (!errorCode) return null;
    if (errorCode === "cannot_update_own_role") return t("cannotUpdateOwnRole");
    if (errorCode === "cannot_update_super_admin") return t("cannotUpdateSuperAdmin");
    if (errorCode === "target_user_not_found") return t("targetUserNotFound");
    if (errorCode === "invalid_role_update_request") return t("invalidRoleUpdateRequest");
    if (errorCode === "invalid_moderation_request") return t("invalidModerationRequest");
    if (errorCode === "app_users_table_missing") return t("appUsersTableMissing");
    return errorCode;
  };
  const { user, isSuperAdmin } = await requireAdmin(withLocalePath("/clients", locale));
  const query = await searchParams;
  const updated = query.updated === "1";
  const errorCode = typeof query.error === "string" ? query.error : null;
  const error = humanizeError(errorCode);
  let clients: AdminClient[] = [];
  let loadingError: string | null = null;
  try {
    clients = await getAdminClients();
  } catch (error) {
    loadingError = error instanceof Error ? error.message : t("loadError");
  }

  const totalListings = clients.reduce((sum, client) => sum + client.listings.length, 0);

  return (
    <div className="container-page max-w-6xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">{t("tag")}</p>
        <h1 className="font-serif text-4xl text-stone-900">{t("title")}</h1>
        <p className="text-stone-700">
          {t("summary", { clients: clients.length, listings: totalListings })}
        </p>
      </header>

      {updated ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {t("updated")}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("errorPrefix")}: {error}
        </p>
      ) : null}
      {loadingError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("errorPrefix")}: {humanizeError(loadingError)}
        </p>
      ) : null}

      {!loadingError && clients.length ? (
        <div className="panel overflow-hidden">
          {clients.map((client) => (
            <details key={client.user.id} className="group border-b border-stone-200 last:border-b-0">
              <summary className="list-none cursor-pointer px-4 py-4 transition hover:bg-[#fff7f6] sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-base font-semibold text-stone-900">{client.user.email ?? t("missingEmail")}</p>
                    <p className="text-xs text-stone-500">
                      {t("createdOn", { date: formatDate(client.user.created_at, locale), count: client.listings.length })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={roleClassName(client.user.role)}>
                      {client.user.role === "super_admin"
                        ? t("roleSuperAdmin")
                        : client.user.role === "admin"
                          ? t("roleAdmin")
                          : t("roleClient")}
                    </span>
                    <span className="text-sm text-stone-400 transition group-open:rotate-180">⌄</span>
                  </div>
                </div>
              </summary>

              <div className="space-y-4 border-t border-stone-200 bg-[#fffdfb] px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={roleClassName(client.user.role)}>
                    {client.user.role === "super_admin"
                      ? t("roleSuperAdmin")
                      : client.user.role === "admin"
                        ? t("roleAdmin")
                        : t("roleClient")}
                  </span>
                  {isSuperAdmin && client.user.id !== user.id && client.user.role !== "super_admin" ? (
                    <form action={adminSetUserRoleAction}>
                      <input type="hidden" name="target_user_id" value={client.user.id} />
                      <input type="hidden" name="role" value={client.user.role === "admin" ? "user" : "admin"} />
                      <button type="submit" className="btn btn-ghost">
                        {client.user.role === "admin" ? t("removeAdmin") : t("makeAdmin")}
                      </button>
                    </form>
                  ) : null}
                </div>

                {client.listings.length ? (
                  <div className="space-y-3">
                    {client.listings.map((listing) => (
                      <article key={listing.id} className="rounded-xl border border-stone-200 bg-white p-3 text-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <Link href={withLocalePath(`/annonces/${listing.slug}`, locale)} className="font-medium link-brand">
                              {listing.title}
                            </Link>
                            <p className="text-xs text-stone-500">
                              {listing.city} • {tStatus(listingStatusLabel(listing) as "active" | "paused" | "archived" | "expired")} •{" "}
                              {t("publishedOn", { date: formatDate(listing.created_at, locale) })}
                            </p>
                            <div className="space-y-1 text-xs text-stone-700">
                              {listing.contact_email ? <p>{t("contactEmail", { value: listing.contact_email })}</p> : null}
                              {listing.contact_whatsapp ? <p>{t("contactWhatsapp", { value: listing.contact_whatsapp })}</p> : null}
                              {!listing.contact_email && !listing.contact_whatsapp ? <p>{t("contactMissing")}</p> : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {listing.status !== "paused" ? (
                              <form action={adminModerateListingStatusAction}>
                                <input type="hidden" name="listing_id" value={listing.id} />
                                <input type="hidden" name="status" value="paused" />
                                <button type="submit" className="btn btn-ghost">
                                  {t("pause")}
                                </button>
                              </form>
                            ) : null}
                            {listing.status !== "active" ? (
                              <form action={adminModerateListingStatusAction}>
                                <input type="hidden" name="listing_id" value={listing.id} />
                                <input type="hidden" name="status" value="active" />
                                <button type="submit" className="btn btn-ghost">
                                  {t("reactivate")}
                                </button>
                              </form>
                            ) : null}
                            {listing.status !== "archived" ? (
                              <form action={adminModerateListingStatusAction}>
                                <input type="hidden" name="listing_id" value={listing.id} />
                                <input type="hidden" name="status" value="archived" />
                                <button type="submit" className="btn btn-ghost">
                                  {t("delete")}
                                </button>
                              </form>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
                    {t("noListing")}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      ) : !loadingError ? (
        <div className="panel p-6 text-stone-700">{t("noAccount")}</div>
      ) : null}
    </div>
  );
}
