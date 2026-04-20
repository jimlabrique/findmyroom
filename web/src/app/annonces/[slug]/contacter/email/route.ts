import { NextResponse } from "next/server";
import { getListingBySlug } from "@/lib/data/listings";
import { trackListingEvent } from "@/lib/data/listing-events";
import { DEFAULT_LOCALE, LOCALE_HEADER, normalizeLocale } from "@/lib/i18n/locales";
import { withLocalePath } from "@/lib/i18n/pathname";
import { getListingContactOptions } from "@/lib/listing";
import { sendListingContactEmail } from "@/lib/email";
import { consumeRateLimitSlot } from "@/lib/rate-limit";
import { getRequestIpFromHeaders, isTrustedRequestHeaders } from "@/lib/security/request";

type EmailContactRouteProps = {
  params: Promise<{ slug: string }>;
};

const EMAIL_CONTACT_RATE_LIMIT_MS = 30_000;

function cleanField(value: string | null) {
  return (value ?? "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function requestLocale(request: Request) {
  return normalizeLocale(request.headers.get(LOCALE_HEADER) ?? DEFAULT_LOCALE);
}

function localizedPath(path: string, request: Request) {
  return withLocalePath(path, requestLocale(request));
}

export async function GET(request: Request, { params }: EmailContactRouteProps) {
  const { slug } = await params;
  return NextResponse.redirect(new URL(`${localizedPath(`/annonces/${slug}`, request)}?error=email_form_invalid_method`, request.url));
}

export async function POST(request: Request, { params }: EmailContactRouteProps) {
  if (!isTrustedRequestHeaders(request.headers)) {
    return NextResponse.redirect(new URL(`${localizedPath("/annonces", request)}?error=untrusted_origin`, request.url));
  }

  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    return NextResponse.redirect(new URL(`${localizedPath("/annonces", request)}?error=listing_not_found`, request.url));
  }

  const options = getListingContactOptions(listing, requestLocale(request));
  const emailOption = options.find((option) => option.method === "email");
  if (!emailOption) {
    return NextResponse.redirect(new URL(`${localizedPath(`/annonces/${slug}`, request)}?error=contact_missing`, request.url));
  }

  const formData = await request.formData();
  const firstName = cleanField(`${formData.get("first_name") ?? ""}`);
  const lastName = cleanField(`${formData.get("last_name") ?? ""}`);
  const senderEmail = cleanField(`${formData.get("sender_email") ?? ""}`);
  const message = cleanField(`${formData.get("message") ?? ""}`);
  const honeypot = cleanField(`${formData.get("website") ?? ""}`);

  if (honeypot) {
    console.warn("[email_contact_spam_blocked]", { slug, ip: getRequestIpFromHeaders(request.headers) });
    return NextResponse.redirect(new URL(`${localizedPath(`/annonces/${slug}`, request)}?email_sent=1`, request.url));
  }

  if (!firstName || !lastName || !senderEmail || !message) {
    return NextResponse.redirect(new URL(`${localizedPath(`/annonces/${slug}`, request)}?error=email_form_missing`, request.url));
  }

  if (!isValidEmail(senderEmail)) {
    return NextResponse.redirect(new URL(`${localizedPath(`/annonces/${slug}`, request)}?error=email_form_invalid`, request.url));
  }

  const clientIp = getRequestIpFromHeaders(request.headers);
  const limit = await consumeRateLimitSlot({
    key: `email_contact:${clientIp}`,
    windowMs: EMAIL_CONTACT_RATE_LIMIT_MS,
  });
  if (limit.limited) {
    return NextResponse.redirect(
      new URL(
        `${localizedPath(`/annonces/${slug}`, request)}?error=email_rate_limited&retry_after=${limit.retryAfterSeconds}`,
        request.url,
      ),
    );
  }

  try {
    const listingPhotoUrl =
      Array.isArray(listing.photo_urls) && listing.photo_urls.length
        ? `${listing.photo_urls[0] ?? ""}`.trim() || null
        : null;

    await sendListingContactEmail({
      to: listing.contact_email ?? "",
      senderFullName: `${firstName} ${lastName}`,
      senderEmail,
      listingTitle: listing.title,
      listingCity: listing.city,
      listingSlug: listing.slug,
      listingPhotoUrl,
      locale: requestLocale(request),
      message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("[email_contact_send_failed]", message || error);
    const lowerMessage = message.toLowerCase();
    const code =
      lowerMessage.includes("email_service_unavailable")
        ? "email_service_unavailable"
        : /invalid login|badcredentials|username and password not accepted|eauth|missing credentials for "plain"/i.test(
              message,
            )
        ? "email_auth_failed"
        : "email_send_failed";
    return NextResponse.redirect(new URL(`${localizedPath(`/annonces/${slug}`, request)}?error=${code}`, request.url));
  }

  await trackListingEvent({
    listingId: listing.id,
    eventType: "click_contact",
    source: "listing_detail_contact_email_sent",
  });

  return NextResponse.redirect(new URL(`${localizedPath(`/annonces/${slug}`, request)}?email_sent=1`, request.url));
}
