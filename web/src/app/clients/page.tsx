import Link from "next/link";
import { adminModerateListingStatusAction, adminSetUserRoleAction } from "@/app/clients/actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminClients, type AdminClient } from "@/lib/data/admin";
import { listingStatusLabel } from "@/lib/listing";

type ClientsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("fr-BE", { dateStyle: "medium" });

function formatDate(value: string) {
  return dateFormat.format(new Date(value));
}

function humanizeError(errorCode: string | null) {
  if (!errorCode) return null;

  if (errorCode === "cannot_update_own_role") return "Tu ne peux pas modifier ton propre role.";
  if (errorCode === "cannot_update_super_admin") return "Impossible de modifier un super admin.";
  if (errorCode === "target_user_not_found") return "Compte introuvable.";
  if (errorCode === "invalid_role_update_request") return "Demande de role invalide.";
  if (errorCode === "invalid_moderation_request") return "Action de moderation invalide.";
  if (errorCode === "app_users_table_missing") return "Table admin manquante: execute le schema SQL a jour.";

  return errorCode;
}

function RoleBadge({ role }: { role: "user" | "admin" | "super_admin" }) {
  const label = role === "super_admin" ? "Super admin" : role === "admin" ? "Admin" : "Client";
  const className =
    role === "super_admin"
      ? "border border-[#e8b0aa] bg-[#fee9e6] text-[#ba4d40]"
      : role === "admin"
        ? "border border-[#edc2bd] bg-[#fff3f1] text-[#c3574a]"
        : "bg-stone-100 text-stone-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const { user, isSuperAdmin } = await requireAdmin("/clients");
  const query = await searchParams;
  const updated = query.updated === "1";
  const errorCode = typeof query.error === "string" ? query.error : null;
  const error = humanizeError(errorCode);
  let clients: AdminClient[] = [];
  let loadingError: string | null = null;
  try {
    clients = await getAdminClients();
  } catch (error) {
    loadingError = error instanceof Error ? error.message : "Impossible de charger les clients.";
  }

  const totalListings = clients.reduce((sum, client) => sum + client.listings.length, 0);

  return (
    <div className="container-page max-w-6xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Backoffice</p>
        <h1 className="font-serif text-4xl text-stone-900">Clients</h1>
        <p className="text-stone-700">
          {clients.length} compte(s) • {totalListings} annonce(s) total.
        </p>
      </header>

      {updated ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Mise a jour enregistree.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Erreur: {error}</p>
      ) : null}
      {loadingError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erreur: {humanizeError(loadingError)}
        </p>
      ) : null}

      {!loadingError && clients.length ? (
        <div className="space-y-4">
          {clients.map((client) => (
            <article key={client.user.id} className="panel space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-stone-900">{client.user.email ?? "email non renseigne"}</p>
                  <p className="text-xs text-stone-500">
                    Cree le {formatDate(client.user.created_at)} • {client.listings.length} annonce(s)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <RoleBadge role={client.user.role} />
                  {isSuperAdmin && client.user.id !== user.id && client.user.role !== "super_admin" ? (
                    <form action={adminSetUserRoleAction}>
                      <input type="hidden" name="target_user_id" value={client.user.id} />
                      <input type="hidden" name="role" value={client.user.role === "admin" ? "user" : "admin"} />
                      <button type="submit" className="btn btn-ghost">
                        {client.user.role === "admin" ? "Retirer admin" : "Nommer admin"}
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>

              {client.listings.length ? (
                <div className="overflow-x-auto rounded-xl border border-stone-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-stone-50 text-left text-stone-600">
                      <tr>
                        <th className="px-3 py-2 font-medium">Annonce</th>
                        <th className="px-3 py-2 font-medium">Ville</th>
                        <th className="px-3 py-2 font-medium">Statut</th>
                        <th className="px-3 py-2 font-medium">Contact</th>
                        <th className="px-3 py-2 font-medium">Moderation</th>
                      </tr>
                    </thead>
                    <tbody className="text-stone-800">
                      {client.listings.map((listing) => (
                        <tr key={listing.id} className="border-t border-stone-100 align-top">
                          <td className="px-3 py-2">
                            <Link href={`/annonces/${listing.slug}`} className="font-medium link-brand">
                              {listing.title}
                            </Link>
                            <p className="text-xs text-stone-500">Publiee le {formatDate(listing.created_at)}</p>
                          </td>
                          <td className="px-3 py-2">{listing.city}</td>
                          <td className="px-3 py-2">{listingStatusLabel(listing)}</td>
                          <td className="px-3 py-2">
                            {listing.contact_email || listing.contact_whatsapp ? (
                              <details>
                                <summary className="cursor-pointer text-xs font-medium text-stone-700">Voir</summary>
                                <div className="mt-2 space-y-1 text-xs text-stone-700">
                                  {listing.contact_email ? <p>Email: {listing.contact_email}</p> : null}
                                  {listing.contact_whatsapp ? <p>WhatsApp: {listing.contact_whatsapp}</p> : null}
                                </div>
                              </details>
                            ) : (
                              <span className="text-xs text-stone-500">Non renseigne</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-2">
                              {listing.status !== "paused" ? (
                                <form action={adminModerateListingStatusAction}>
                                  <input type="hidden" name="listing_id" value={listing.id} />
                                  <input type="hidden" name="status" value="paused" />
                                  <button type="submit" className="btn btn-ghost">
                                    Pause
                                  </button>
                                </form>
                              ) : null}
                              {listing.status !== "active" ? (
                                <form action={adminModerateListingStatusAction}>
                                  <input type="hidden" name="listing_id" value={listing.id} />
                                  <input type="hidden" name="status" value="active" />
                                  <button type="submit" className="btn btn-ghost">
                                    Reactiver
                                  </button>
                                </form>
                              ) : null}
                              {listing.status !== "archived" ? (
                                <form action={adminModerateListingStatusAction}>
                                  <input type="hidden" name="listing_id" value={listing.id} />
                                  <input type="hidden" name="status" value="archived" />
                                  <button type="submit" className="btn btn-ghost">
                                    Supprimer
                                  </button>
                                </form>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
                  Aucune annonce.
                </div>
              )}
            </article>
          ))}
        </div>
      ) : !loadingError ? (
        <div className="panel p-6 text-stone-700">Aucun compte trouve.</div>
      ) : null}
    </div>
  );
}
