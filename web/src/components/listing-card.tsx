import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";
import { listingDisplayTitle, listingPriceRangeLabel, listingRoomsSummary, listingTypeLabel, type Listing } from "@/lib/listing";
import { getLocalizedCommuneLabel } from "@/lib/listing-form-options";
import { ListingCardCarousel } from "@/components/listing-card-carousel";

type ListingCardProps = {
  listing: Pick<
    Listing,
    | "slug"
    | "title"
    | "listing_type"
    | "city"
    | "rent_eur"
    | "available_rooms"
    | "total_rooms"
    | "available_from"
    | "photo_urls"
    | "room_details"
    | "created_at"
    | "housing_description"
  >;
};

export async function ListingCard({ listing }: ListingCardProps) {
  const locale = (await getLocale()) as AppLocale;
  const tCommon = await getTranslations("common.actions");
  const tCard = await getTranslations("listings.card");
  const dateLocale = locale === "en" ? "en-GB" : locale === "nl" ? "nl-BE" : "fr-BE";
  const createdAtLabel = new Intl.DateTimeFormat(dateLocale, { dateStyle: "short" }).format(new Date(listing.created_at));
  const detailsHref = withLocalePath(`/annonces/${listing.slug}`, locale);
  const displayTitle = listingDisplayTitle(listing, locale);
  const displayCity = getLocalizedCommuneLabel(listing.city, locale);

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md sm:grid sm:grid-cols-[340px_1fr]">
      <ListingCardCarousel
        photos={listing.photo_urls}
        title={displayTitle}
        href={detailsHref}
      />

      <div className="flex h-full flex-col justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold text-stone-900">{displayTitle}</h3>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700">{createdAtLabel}</span>
            <span className="rounded-full bg-[#fff1ee] px-2 py-1 text-xs font-medium text-[#ba4d40]">
              {listingTypeLabel(listing.listing_type, locale)}
            </span>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
          <p className="font-medium">{displayCity}</p>
          <p className="sm:text-right">{listingPriceRangeLabel(listing, locale)}</p>
          <p>{listingRoomsSummary(listing, locale)}</p>
          <p className="sm:text-right">{tCard("available", { date: listing.available_from })}</p>
        </div>

        <Link
          href={detailsHref}
          className="btn btn-primary w-fit text-sm"
        >
          {tCommon("voirAnnonce")}
        </Link>
      </div>
    </article>
  );
}
