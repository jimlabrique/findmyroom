import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOwnerListingMetrics } from "@/lib/data/listing-events";
import { getOwnerListings } from "@/lib/data/listings";

export const dynamic = "force-dynamic";

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
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
  const { user } = await requireUser("/statistiques");
  const listings = await getOwnerListings(user.id);
  if (!listings.length) {
    redirect("/deposer");
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
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Statistiques</p>
        <h1 className="font-serif text-4xl text-stone-900">Performance annonces</h1>
        <p className="text-stone-700">Suivi direct de la traction: vues, clics contact et taux de conversion.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Annonces actives" value={`${activeListings}`} hint="Stock live" />
        <KpiCard label="Vues annonces" value={`${totalViews}`} hint="Volume interesse" />
        <KpiCard label="Clics contact" value={`${totalContacts}`} hint="Intentions fortes" />
        <KpiCard label="Taux clic/vue" value={formatPercent(clickThroughRate)} hint="Signal qualite" />
      </section>

      <section className="panel space-y-4 p-5">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-serif text-2xl text-stone-900">Top annonces</h2>
          <Link href="/mes-annonces" className="text-sm font-medium text-orange-700 hover:text-orange-800">
            Gerer mes annonces
          </Link>
        </div>

        {topListings.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-stone-500">
                <tr>
                  <th className="pb-2 pr-3 font-medium">Annonce</th>
                  <th className="pb-2 pr-3 font-medium">Ville</th>
                  <th className="pb-2 pr-3 font-medium">Vues</th>
                  <th className="pb-2 pr-3 font-medium">Contacts</th>
                  <th className="pb-2 pr-3 font-medium">CTR</th>
                </tr>
              </thead>
              <tbody className="text-stone-800">
                {topListings.map((listing) => (
                  <tr key={listing.id} className="border-t border-stone-100">
                    <td className="py-2 pr-3">
                      <Link href={`/annonces/${listing.slug}`} className="font-medium hover:text-orange-700">
                        {listing.title}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{listing.city}</td>
                    <td className="py-2 pr-3">{listing.views}</td>
                    <td className="py-2 pr-3">{listing.contacts}</td>
                    <td className="py-2 pr-3">{formatPercent(listing.ctr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm text-stone-700">Aucune annonce pour le moment.</p>
            <Link href="/deposer" className="btn btn-primary">
              Deposer une annonce
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
