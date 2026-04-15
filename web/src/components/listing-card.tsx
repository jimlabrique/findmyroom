import Link from "next/link";
import { listingPriceRangeLabel, listingRoomsSummary, type Listing } from "@/lib/listing";
import { ListingCardCarousel } from "@/components/listing-card-carousel";

type ListingCardProps = {
  listing: Pick<
    Listing,
    | "slug"
    | "title"
    | "city"
    | "rent_eur"
    | "available_rooms"
    | "total_rooms"
    | "available_from"
    | "photo_urls"
    | "room_details"
    | "created_at"
  >;
};

export function ListingCard({ listing }: ListingCardProps) {
  const createdAtLabel = new Intl.DateTimeFormat("fr-BE", { dateStyle: "short" }).format(new Date(listing.created_at));

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md sm:grid sm:grid-cols-[340px_1fr]">
      <ListingCardCarousel
        photos={listing.photo_urls}
        title={listing.title}
        href={`/annonces/${listing.slug}`}
      />

      <div className="flex h-full flex-col justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold text-stone-900">{listing.title}</h3>
          <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700">{createdAtLabel}</span>
        </div>

        <div className="grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
          <p className="font-medium">{listing.city}</p>
          <p className="sm:text-right">{listingPriceRangeLabel(listing)}</p>
          <p>{listingRoomsSummary(listing)}</p>
          <p className="sm:text-right">Dispo {listing.available_from}</p>
        </div>

        <Link
          href={`/annonces/${listing.slug}`}
          className="btn btn-primary w-fit text-sm"
        >
          Voir l&apos;annonce
        </Link>
      </div>
    </article>
  );
}
