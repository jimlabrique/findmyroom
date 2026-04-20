import { NextResponse } from "next/server";
import { getListingBySlug } from "@/lib/data/listings";
import { trackListingEvent } from "@/lib/data/listing-events";
import { DEFAULT_LOCALE, LOCALE_HEADER, normalizeLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";
import { getListingContactOptions } from "@/lib/listing";

type ContactRouteProps = {
  params: Promise<{ slug: string }>;
};

function requestLocale(request: Request) {
  return normalizeLocale(request.headers.get(LOCALE_HEADER) ?? DEFAULT_LOCALE);
}

function localizedPath(path: string, request: Request) {
  return withLocalePath(path, requestLocale(request));
}

export async function GET(request: Request, { params }: ContactRouteProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    return NextResponse.redirect(new URL(`${localizedPath("/annonces", request)}?error=listing_not_found`, request.url));
  }

  const url = new URL(request.url);
  const requestedMethod = url.searchParams.get("method");
  const options = getListingContactOptions(listing, requestLocale(request));
  if (!options.length) {
    return NextResponse.redirect(new URL(`${localizedPath(`/annonces/${slug}`, request)}?error=contact_missing`, request.url));
  }

  const targetOption = requestedMethod ? options.find((option) => option.method === requestedMethod) : options[0];
  if (!targetOption) {
    return NextResponse.redirect(
      new URL(`${localizedPath(`/annonces/${slug}`, request)}?error=contact_method_invalid`, request.url),
    );
  }

  await trackListingEvent({
    listingId: listing.id,
    eventType: "click_contact",
    source: targetOption.method === "phone" ? "listing_detail_contact_whatsapp" : "listing_detail_contact_email",
  });

  return NextResponse.redirect(targetOption.href);
}
