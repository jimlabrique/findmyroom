import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { searchListings } from "@/lib/data/listings";

type ListingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readString(input: string | string[] | undefined) {
  if (typeof input === "string") return input.trim();
  return "";
}

function readPositiveNumber(input: string | string[] | undefined) {
  const parsed = Number.parseInt(readString(input), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

export const dynamic = "force-dynamic";

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const query = await searchParams;
  const textQuery = readString(query.q);
  const city = readString(query.city) || "Bruxelles";
  const minRent = readPositiveNumber(query.min_rent);
  const maxRent = readPositiveNumber(query.max_rent);
  const availableFrom = readString(query.available_from);
  const minRooms = readPositiveNumber(query.min_rooms);
  const leaseType = readString(query.lease_type);
  const maxMinDuration = readPositiveNumber(query.max_min_duration_months);
  const contactRaw = readString(query.contact);
  const contact = contactRaw === "email" || contactRaw === "phone" ? contactRaw : undefined;
  const animalsPolicyRaw = readString(query.animals_policy);
  const animalsPolicy =
    animalsPolicyRaw === "yes" || animalsPolicyRaw === "no" || animalsPolicyRaw === "negotiable"
      ? animalsPolicyRaw
      : undefined;
  const roomFurnishingRaw = readString(query.room_furnishing);
  const roomFurnishing =
    roomFurnishingRaw === "furnished" || roomFurnishingRaw === "unfurnished" || roomFurnishingRaw === "partially_furnished"
      ? roomFurnishingRaw
      : undefined;
  const roomBathroomRaw = readString(query.room_bathroom);
  const roomBathroom = roomBathroomRaw === "private" || roomBathroomRaw === "shared" ? roomBathroomRaw : undefined;
  const sortRaw = readString(query.sort);
  const sort = sortRaw === "price_asc" || sortRaw === "price_desc" || sortRaw === "available_asc" ? sortRaw : "latest";

  const listings = await searchListings({
    query: textQuery || undefined,
    city: city || undefined,
    minRent,
    maxRent,
    availableFrom: availableFrom || undefined,
    minRooms,
    leaseType: leaseType || undefined,
    maxMinDuration,
    contactMethod: contact,
    animalsPolicy,
    roomFurnishing,
    roomBathroom,
    sort,
  });

  return (
    <div className="container-page space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Recherche</p>
        <h1 className="font-serif text-4xl text-stone-900">Annonces de colocation</h1>
        <p className="text-stone-700">Bruxelles est preselectionnee par defaut. Tu peux changer la commune a tout moment.</p>
      </header>

      <section className="panel p-4 sm:p-5">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <input name="q" placeholder="Mot-cle (quartier, vibe, equipement)" className="input lg:col-span-4" defaultValue={textQuery} />
          <input name="city" placeholder="Commune" className="input lg:col-span-3" defaultValue={city} />
          <input
            name="min_rent"
            type="number"
            min={0}
            placeholder="Loyer min"
            className="input"
            aria-label="Loyer minimum"
            defaultValue={minRent ?? ""}
          />
          <input
            name="max_rent"
            type="number"
            min={0}
            placeholder="Loyer max"
            className="input"
            aria-label="Loyer maximum"
            defaultValue={maxRent ?? ""}
          />
          <input
            name="available_from"
            type="date"
            className="input"
            aria-label="Disponible au plus tard"
            defaultValue={availableFrom || ""}
          />
          <select name="min_rooms" className="input lg:col-span-2" defaultValue={minRooms?.toString() ?? ""}>
            <option value="">Chambres min</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
          </select>
          <select name="lease_type" className="input lg:col-span-2" defaultValue={leaseType}>
            <option value="">Type de bail</option>
            <option value="1 an">Bail 1 an</option>
            <option value="court">Bail court</option>
            <option value="sous">Sous-location</option>
          </select>
          <input
            name="max_min_duration_months"
            type="number"
            min={1}
            placeholder="Duree min max (mois)"
            className="input lg:col-span-2"
            defaultValue={maxMinDuration ?? ""}
          />
          <select name="contact" className="input lg:col-span-2" defaultValue={contact ?? ""}>
            <option value="">Contact: tous</option>
            <option value="phone">WhatsApp</option>
            <option value="email">Email</option>
          </select>
          <select name="animals_policy" className="input lg:col-span-2" defaultValue={animalsPolicy ?? ""}>
            <option value="">Animaux: tous</option>
            <option value="yes">Animaux oui</option>
            <option value="no">Animaux non</option>
            <option value="negotiable">Animaux a discuter</option>
          </select>
          <select name="room_furnishing" className="input lg:col-span-2" defaultValue={roomFurnishing ?? ""}>
            <option value="">Meublee: toutes</option>
            <option value="furnished">Meublee</option>
            <option value="unfurnished">Non meublee</option>
            <option value="partially_furnished">Partiellement meublee</option>
          </select>
          <select name="room_bathroom" className="input lg:col-span-2" defaultValue={roomBathroom ?? ""}>
            <option value="">SDB: toutes</option>
            <option value="private">SDB privative</option>
            <option value="shared">SDB partagee</option>
          </select>
          <select name="sort" className="input lg:col-span-2" defaultValue={sort}>
            <option value="latest">Plus recentes</option>
            <option value="available_asc">Dispo la plus proche</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix decroissant</option>
          </select>
          <button type="submit" className="btn btn-primary sm:col-span-1 lg:col-span-1">
            Filtrer
          </button>
          <Link href="/annonces" className="btn btn-ghost sm:col-span-1 lg:col-span-1">
            Reset
          </Link>
        </form>
      </section>

      <section className="space-y-4">
        <p className="text-sm text-stone-600">{listings.length} resultat(s)</p>
        {listings.length ? (
          <div className="grid-listings">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="panel p-6 text-stone-700">
            Aucun resultat. Elargis la ville ou le budget et relance.
          </div>
        )}
      </section>
    </div>
  );
}
