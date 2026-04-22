import Link from "next/link";
import type { AppLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";
import {
  listingCandidatePreferenceSummaryLabel,
  listingDisplayTitle,
  listingPriceRangeLabel,
  listingRoomsSummary,
  listingTypeLabel,
  type Listing,
} from "@/lib/listing";
import { getLocalizedCommuneLabel } from "@/lib/listing-form-options";
import { ListingCardCarousel } from "@/components/listing-card-carousel";

type ListingCardProps = {
  locale: AppLocale;
  viewListingLabel: string;
  availableLabel: string;
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
    | "flatshare_vibe"
  >;
};

export async function ListingCard({ listing, locale, viewListingLabel, availableLabel }: ListingCardProps) {
  const dateLocale = locale === "en" ? "en-GB" : locale === "nl" ? "nl-BE" : "fr-BE";
  const createdAtLabel = new Intl.DateTimeFormat(dateLocale, { dateStyle: "short" }).format(new Date(listing.created_at));
  const detailsHref = withLocalePath(`/annonces/${listing.slug}`, locale);
  const displayTitle = listingDisplayTitle(listing, locale);
  const displayCity = getLocalizedCommuneLabel(listing.city, locale);
  const candidatePreferenceLabel = listingCandidatePreferenceSummaryLabel(listing.flatshare_vibe, locale);

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md sm:grid sm:grid-cols-[340px_1fr]">
      <ListingCardCarousel photos={listing.photo_urls} title={displayTitle} href={detailsHref} />

      <div className="flex h-full flex-col gap-3 border-t border-stone-100 p-3 sm:justify-between sm:gap-4 sm:border-t-0 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 line-clamp-2 text-base font-semibold text-stone-900">{displayTitle}</h3>
          <div className="shrink-0 flex flex-col items-end gap-1">
            <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700">{createdAtLabel}</span>
            <span className="rounded-full bg-[#fff1ee] px-2 py-1 text-xs font-medium text-[#ba4d40]">
              {listingTypeLabel(listing.listing_type, locale)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-stone-700">
          <p className="font-medium">{displayCity}</p>
          <p className="text-right">{listingPriceRangeLabel(listing, locale)}</p>
          <p className="col-span-2 sm:col-span-1">
            {listingRoomsSummary(listing, locale)}
            {candidatePreferenceLabel ? ` • ${candidatePreferenceLabel}` : ""}
          </p>
          <p className="col-span-2 text-stone-600 sm:col-span-1 sm:text-right">{availableLabel}</p>
        </div>

        <Link href={detailsHref} className="btn btn-primary w-full text-sm sm:w-fit">
          {viewListingLabel}
        </Link>
      </div>
    </article>
  );
}
