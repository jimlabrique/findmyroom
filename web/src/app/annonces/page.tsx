import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { SearchCommuneNeighborhoodFields } from "@/components/search-commune-neighborhood-fields";
import { searchListings } from "@/lib/data/listings";
import { BRUSSELS_COMMUNES } from "@/lib/listing-form-options";

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
  const neighborhood = readString(query.neighborhood);
  const typeRaw = readString(query.type);
  const selectedType = typeRaw === "all" || typeRaw === "studio" || typeRaw === "colocation" ? typeRaw : "all";
  const listingTypeFilter = selectedType === "all" ? undefined : selectedType;
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
  const hasAdvancedFilters =
    Boolean(leaseType) ||
    Boolean(maxMinDuration) ||
    Boolean(contact) ||
    Boolean(animalsPolicy) ||
    Boolean(roomFurnishing) ||
    Boolean(roomBathroom);
  const isAllBrussels = city === "Bruxelles";
  const customCity =
    city && city !== "Bruxelles" && !BRUSSELS_COMMUNES.includes(city as (typeof BRUSSELS_COMMUNES)[number])
      ? city
      : null;

  const listings = await searchListings({
    query: textQuery || undefined,
    city: city || undefined,
    neighborhood: !isAllBrussels ? neighborhood || undefined : undefined,
    listingType: listingTypeFilter,
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
      <section className="panel p-4 sm:p-5">
        <form className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6 xl:items-end">
            <div className="sm:col-span-2 xl:col-span-2">
              <label htmlFor="q" className="label">
                Recherche
              </label>
              <input
                id="q"
                name="q"
                placeholder="Mot-clé (quartier, vibe, équipement)"
                className="input"
                defaultValue={textQuery}
              />
            </div>

            <SearchCommuneNeighborhoodFields
              initialCity={city}
              initialNeighborhood={neighborhood}
              customCity={customCity}
            />

            <div>
              <label htmlFor="type" className="label">
                Type
              </label>
              <select id="type" name="type" className="input" defaultValue={selectedType}>
                <option value="all">Tous</option>
                <option value="colocation">Colocation</option>
                <option value="studio">Studio</option>
              </select>
            </div>

            <div>
              <label htmlFor="available_from" className="label">
                Disponible le
              </label>
              <input id="available_from" name="available_from" type="date" className="input" defaultValue={availableFrom || ""} />
            </div>

            <div>
              <label htmlFor="sort" className="label">
                Tri
              </label>
              <select id="sort" name="sort" className="input" defaultValue={sort}>
                <option value="latest">Plus récentes</option>
                <option value="available_asc">Dispo la plus proche</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </div>

            <div>
              <label htmlFor="max_rent" className="label">
                Loyer max (EUR)
              </label>
              <input
                id="max_rent"
                name="max_rent"
                type="number"
                min={0}
                placeholder="Max"
                className="input"
                defaultValue={maxRent ?? ""}
              />
            </div>

            <details className="peer sm:col-span-2 xl:col-span-1 xl:self-end" open={hasAdvancedFilters}>
              <summary className="btn btn-ghost inline-flex w-full cursor-pointer list-none justify-center">
                Filtres avancés
              </summary>
            </details>

            <div className="flex w-full items-end gap-2 xl:self-end">
              <button type="submit" className="btn btn-primary min-w-0 flex-1">
                Filtrer
              </button>
              <Link href="/annonces" className="btn btn-ghost h-[42px] w-[42px] p-0" aria-label="Réinitialiser les filtres">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <path d="M3 4v4h4" />
                </svg>
              </Link>
            </div>

            <div className="hidden sm:col-span-2 xl:col-span-6 peer-open:block rounded-xl border border-stone-200 bg-[#fffaf8] p-3 sm:p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="min_rooms" className="label">
                    Chambres minimum
                  </label>
                  <select id="min_rooms" name="min_rooms" className="input" defaultValue={minRooms?.toString() ?? ""}>
                    <option value="">Sans minimum</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="lease_type" className="label">
                    Type de bail
                  </label>
                  <select id="lease_type" name="lease_type" className="input" defaultValue={leaseType}>
                    <option value="">Tous</option>
                    <option value="1 an">Bail 1 an</option>
                    <option value="court">Bail court</option>
                    <option value="sous">Sous-location</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="max_min_duration_months" className="label">
                    Durée min max (mois)
                  </label>
                  <input
                    id="max_min_duration_months"
                    name="max_min_duration_months"
                    type="number"
                    min={1}
                    placeholder="Ex: 6"
                    className="input"
                    defaultValue={maxMinDuration ?? ""}
                  />
                </div>

                <div>
                  <label htmlFor="contact" className="label">
                    Contact
                  </label>
                  <select id="contact" name="contact" className="input" defaultValue={contact ?? ""}>
                    <option value="">Tous</option>
                    <option value="phone">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="animals_policy" className="label">
                    Animaux
                  </label>
                  <select id="animals_policy" name="animals_policy" className="input" defaultValue={animalsPolicy ?? ""}>
                    <option value="">Tous</option>
                    <option value="yes">Animaux oui</option>
                    <option value="no">Animaux non</option>
                    <option value="negotiable">Animaux à discuter</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="room_furnishing" className="label">
                    Meublé
                  </label>
                  <select id="room_furnishing" name="room_furnishing" className="input" defaultValue={roomFurnishing ?? ""}>
                    <option value="">Toutes</option>
                    <option value="furnished">Meublé</option>
                    <option value="unfurnished">Non meublé</option>
                    <option value="partially_furnished">Partiellement meublé</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="room_bathroom" className="label">
                    Salle de bain
                  </label>
                  <select id="room_bathroom" name="room_bathroom" className="input" defaultValue={roomBathroom ?? ""}>
                    <option value="">Toutes</option>
                    <option value="private">SDB privative</option>
                    <option value="shared">SDB partagée</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <p className="text-sm text-stone-600">{listings.length} résultat(s)</p>
        {listings.length ? (
          <div className="grid-listings">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="panel p-6 text-stone-700">
            Aucun résultat. Élargis la ville ou le budget et relance.
          </div>
        )}
      </section>
    </div>
  );
}
