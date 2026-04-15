import { NextResponse } from "next/server";
import { getListingBySlug } from "@/lib/data/listings";
import { trackListingEvent } from "@/lib/data/listing-events";
import { getListingContactOptions } from "@/lib/listing";
import { sendListingContactEmail } from "@/lib/email";
import { consumeRateLimitSlot } from "@/lib/rate-limit";

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

function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

export async function GET(request: Request, { params }: EmailContactRouteProps) {
  const { slug } = await params;
  return NextResponse.redirect(new URL(`/annonces/${slug}?error=email_form_invalid_method`, request.url));
}

export async function POST(request: Request, { params }: EmailContactRouteProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    return NextResponse.redirect(new URL("/annonces?error=listing_not_found", request.url));
  }

  const options = getListingContactOptions(listing);
  const emailOption = options.find((option) => option.method === "email");
  if (!emailOption) {
    return NextResponse.redirect(new URL(`/annonces/${slug}?error=contact_missing`, request.url));
  }

  const formData = await request.formData();
  const firstName = cleanField(`${formData.get("first_name") ?? ""}`);
  const lastName = cleanField(`${formData.get("last_name") ?? ""}`);
  const senderEmail = cleanField(`${formData.get("sender_email") ?? ""}`);
  const message = cleanField(`${formData.get("message") ?? ""}`);
  const honeypot = cleanField(`${formData.get("website") ?? ""}`);

  if (honeypot) {
    console.warn("[email_contact_spam_blocked]", { slug, ip: getRequestIp(request) });
    return NextResponse.redirect(new URL(`/annonces/${slug}?email_sent=1`, request.url));
  }

  if (!firstName || !lastName || !senderEmail || !message) {
    return NextResponse.redirect(new URL(`/annonces/${slug}?error=email_form_missing`, request.url));
  }

  if (!isValidEmail(senderEmail)) {
    return NextResponse.redirect(new URL(`/annonces/${slug}?error=email_form_invalid`, request.url));
  }

  const clientIp = getRequestIp(request);
  const limit = consumeRateLimitSlot({
    key: `email_contact:${clientIp}`,
    windowMs: EMAIL_CONTACT_RATE_LIMIT_MS,
  });
  if (limit.limited) {
    return NextResponse.redirect(
      new URL(`/annonces/${slug}?error=email_rate_limited&retry_after=${limit.retryAfterSeconds}`, request.url),
    );
  }

  try {
    await sendListingContactEmail({
      to: listing.contact_email ?? "",
      senderFullName: `${firstName} ${lastName}`,
      senderEmail,
      listingTitle: listing.title,
      listingCity: listing.city,
      message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("[email_contact_send_failed]", message || error);
    const code =
      /invalid login|badcredentials|username and password not accepted/i.test(message)
        ? "email_auth_failed"
        : "email_send_failed";
    return NextResponse.redirect(new URL(`/annonces/${slug}?error=${code}`, request.url));
  }

  await trackListingEvent({
    listingId: listing.id,
    eventType: "click_contact",
    source: "listing_detail_contact_email_sent",
  });

  return NextResponse.redirect(new URL(`/annonces/${slug}?email_sent=1`, request.url));
}
