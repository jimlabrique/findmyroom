import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getOwnerListings } from "@/lib/data/listings";
import { getOwnerListingMetrics } from "@/lib/data/listing-events";
import { updateListingStatusAction } from "@/app/mes-annonces/actions";
import { listingStatusLabel } from "@/lib/listing";

type MyListingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

function nextStatus(status: "active" | "paused" | "archived") {
  if (status === "active") return "paused";
  if (status === "paused") return "active";
  return "active";
}

export default async function MyListingsPage({ searchParams }: MyListingsPageProps) {
  const { user } = await requireUser("/mes-annonces");
  const query = await searchParams;
  const updated = query.updated === "1";
  const error = typeof query.error === "string" ? query.error : null;

  const listings = await getOwnerListings(user.id);
  const metricsByListingId = await getOwnerListingMetrics(listings.map((listing) => listing.id));

  return (
    <div className="container-page max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Dashboard</p>
          <h1 className="font-serif text-4xl text-stone-900">Mes annonces</h1>
        </div>
        <Link href="/deposer" className="btn btn-primary">
          Nouvelle annonce
        </Link>
      </header>

      {updated ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Mise a jour enregistree.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Erreur: {error}</p>
      ) : null}

      {listings.length ? (
        <div className="space-y-4">
          {listings.map((listing) => {
            const statusToggle = nextStatus(listing.status as "active" | "paused" | "archived");
            const metrics = metricsByListingId.get(listing.id) ?? { views: 0, contacts: 0 };
            const statusLabel = listingStatusLabel(listing);
            const expiresAtLabel = typeof listing.expires_at === "string" ? listing.expires_at : "non defini";
            return (
              <article key={listing.id} className="panel space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-stone-900">{listing.title}</h2>
                    <p className="text-sm text-stone-600">
                      {listing.city} • {listing.rent_eur} EUR • {listing.available_rooms} chambre(s)
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      Expire le {expiresAtLabel} • {metrics.views} vue(s) • {metrics.contacts} clic(s) contact
                    </p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-stone-700">
                    {statusLabel}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/annonces/${listing.slug}`} className="btn btn-ghost">
                    Voir
                  </Link>
                  <Link href={`/mes-annonces/${listing.id}/editer`} className="btn btn-ghost">
                    Editer
                  </Link>
                  <form action={updateListingStatusAction}>
                    <input type="hidden" name="listing_id" value={listing.id} />
                    <input type="hidden" name="status" value={statusToggle} />
                    <button type="submit" className="btn btn-ghost">
                      {statusToggle === "paused" ? "Mettre en pause" : "Reactiver"}
                    </button>
                  </form>
                  {listing.status !== "archived" ? (
                    <form action={updateListingStatusAction}>
                      <input type="hidden" name="listing_id" value={listing.id} />
                      <input type="hidden" name="status" value="archived" />
                      <button type="submit" className="btn btn-ghost">
                        Archiver
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="panel p-6 text-stone-700">Tu n&apos;as pas encore publie d&apos;annonce.</div>
      )}
    </div>
  );
}
