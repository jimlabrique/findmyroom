import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { getLatestListings } from "@/lib/data/listings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const latestListings = await getLatestListings(6);
  return (
    <div className="container-page space-y-8">
      <section className="panel p-8">
        <div className="space-y-4">
          <p className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-700">
            Bruxelles
          </p>
          <h1 className="font-serif text-4xl leading-tight text-stone-900 sm:text-5xl">
            Les chambres en coloc a Bruxelles, sans le chaos des groupes Facebook.
          </h1>
          <p className="max-w-2xl text-base text-stone-700 sm:text-lg">
            App d&apos;annonces dediee a la colocation: publier vite, chercher vite, contacter vite.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/deposer" className="btn btn-primary">
              Deposer une chambre
            </Link>
            <Link href="/annonces?city=Bruxelles" className="btn btn-ghost">
              Voir Bruxelles
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl text-stone-900">Dernieres annonces</h2>
          <Link href="/annonces" className="text-sm font-medium text-orange-700 hover:text-orange-800">
            Voir toutes les annonces
          </Link>
        </div>

        {latestListings.length ? (
          <div className="grid-listings">
            {latestListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="panel p-6 text-stone-700">Aucune annonce active pour le moment.</div>
        )}
      </section>
    </div>
  );
}
