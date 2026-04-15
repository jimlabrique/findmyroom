import type { Database } from "@/lib/database.types";

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
export type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];
export type ListingPhoto = { url: string; caption: string };
export type ContactMethod = "phone" | "email";
export type ListingContactOption = { method: ContactMethod; href: string; label: string; channelLabel: string };

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

export function slugifyListingTitle(title: string, city: string) {
  const raw = `${title}-${city}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  return raw || `findmyroom-${Date.now()}`;
}

export function cleanOptionalText(value: FormDataEntryValue | null) {
  const cleaned = `${value ?? ""}`.trim();
  return cleaned.length ? cleaned : null;
}

export function listingPhotosFromRow(
  listing: Partial<Pick<Listing, "photo_urls" | "photo_captions">>,
): ListingPhoto[] {
  const urls = Array.isArray(listing.photo_urls)
    ? listing.photo_urls.map((url) => `${url ?? ""}`.trim()).filter((url) => url.length > 0)
    : [];
  const captions = Array.isArray(listing.photo_captions) ? listing.photo_captions : [];

  return urls.map((url, index) => ({
    url,
    caption: captions[index] ?? "",
  }));
}

export function parseOptionalInt(value: FormDataEntryValue | null) {
  const raw = `${value ?? ""}`.trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseRequiredInt(value: FormDataEntryValue | null, fieldName: string) {
  const parsed = parseOptionalInt(value);
  if (parsed === null || parsed <= 0) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return parsed;
}

export function normalizeWhatsapp(value: FormDataEntryValue | null) {
  const raw = `${value ?? ""}`.trim();
  if (!raw) return null;
  const normalized = raw.replace(/[^\d+]/g, "");
  return normalized.length ? normalized : null;
}

export function getListingContactOptions(
  listing: Pick<Listing, "contact_whatsapp" | "contact_email" | "title" | "city">,
): ListingContactOption[] {
  const options: ListingContactOption[] = [];

  if (listing.contact_whatsapp) {
    const digitsOnly = listing.contact_whatsapp.replace(/[^\d]/g, "");
    if (digitsOnly) {
      const text = encodeURIComponent(
        `Bonjour, je suis interesse par votre annonce "${listing.title}" a ${listing.city}.`,
      );
      options.push({
        method: "phone",
        href: `https://wa.me/${digitsOnly}?text=${text}`,
        label: "Ecrire sur WhatsApp",
        channelLabel: "WhatsApp",
      });
    }
  }

  if (listing.contact_email) {
    const subject = encodeURIComponent(`Annonce coloc: ${listing.title}`);
    const body = encodeURIComponent(`Bonjour,\n\nJe suis interesse par votre annonce a ${listing.city}.\n`);
    options.push({
      method: "email",
      href: `mailto:${listing.contact_email}?subject=${subject}&body=${body}`,
      label: "Envoyer un email",
      channelLabel: "Email",
    });
  }

  return options;
}

export function makeContactHref(listing: Pick<Listing, "contact_whatsapp" | "contact_email" | "title" | "city">) {
  return getListingContactOptions(listing)[0]?.href ?? "#";
}

export function isListingExpired(listing: Pick<Listing, "expires_at">) {
  return listing.expires_at < isoToday();
}

export function listingStatusLabel(listing: Pick<Listing, "status" | "expires_at">) {
  if (listing.status === "active" && isListingExpired(listing)) {
    return "expired";
  }
  return listing.status;
}
