import type { Database } from "@/lib/database.types";
import {
  ANIMALS_POLICY_OPTIONS,
  CURRENT_FLATMATES_OPTIONS,
  ROOM_BATHROOM_OPTIONS,
  ROOM_FURNISHING_OPTIONS,
  ROOM_OUTDOOR_OPTIONS,
  ROOM_VIEW_OPTIONS,
} from "@/lib/listing-form-options";

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
export type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];
export type ListingPhoto = { url: string; caption: string };
export type RoomFurnishing = "furnished" | "unfurnished" | "partially_furnished";
export type RoomBathroom = "private" | "shared";
export type RoomOutdoor = "balcony" | "terrace" | "garden" | "none";
export type RoomView = "garden" | "courtyard" | "street" | "other";
export type AnimalsPolicy = "yes" | "no" | "negotiable";
export type ListingRoomDetail = {
  index: number;
  size_sqm: number;
  price_eur: number;
  furnishing: RoomFurnishing;
  bathroom: RoomBathroom;
  outdoor: RoomOutdoor;
  view: RoomView;
};
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

function toValidInt(value: unknown) {
  const parsed = Number.parseInt(`${value ?? ""}`, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function optionValueSet(options: ReadonlyArray<{ value: string }>) {
  return new Set(options.map((option) => option.value));
}

const ROOM_FURNISHING_VALUES = optionValueSet(ROOM_FURNISHING_OPTIONS);
const ROOM_BATHROOM_VALUES = optionValueSet(ROOM_BATHROOM_OPTIONS);
const ROOM_OUTDOOR_VALUES = optionValueSet(ROOM_OUTDOOR_OPTIONS);
const ROOM_VIEW_VALUES = optionValueSet(ROOM_VIEW_OPTIONS);
const ANIMALS_POLICY_VALUES = optionValueSet(ANIMALS_POLICY_OPTIONS);
const CURRENT_FLATMATES_LABELS: Map<string, string> = new Map([
  ...CURRENT_FLATMATES_OPTIONS.map((item) => [item.value, item.label] as const),
  ["majorite_filles", "Filles only"] as const,
  ["majorite_garcons", "Garcons only"] as const,
]);

export function listingRoomDetailsFromRow(listing: Partial<Pick<Listing, "room_details">>): ListingRoomDetail[] {
  if (!Array.isArray(listing.room_details)) {
    return [];
  }

  const parsed: ListingRoomDetail[] = [];
  for (const item of listing.room_details) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }

    const source = item as Record<string, unknown>;
    const index = toValidInt(source.index);
    const sizeSqm = toValidInt(source.size_sqm);
    const priceEur = toValidInt(source.price_eur);
    const furnishing = `${source.furnishing ?? ""}`.trim() as RoomFurnishing;
    const bathroom = `${source.bathroom ?? ""}`.trim() as RoomBathroom;
    const outdoor = `${source.outdoor ?? ""}`.trim() as RoomOutdoor;
    const view = `${source.view ?? ""}`.trim() as RoomView;

    if (!index || !sizeSqm || !priceEur) continue;
    if (!ROOM_FURNISHING_VALUES.has(furnishing)) continue;
    if (!ROOM_BATHROOM_VALUES.has(bathroom)) continue;
    if (!ROOM_OUTDOOR_VALUES.has(outdoor)) continue;
    if (!ROOM_VIEW_VALUES.has(view)) continue;

    parsed.push({
      index,
      size_sqm: sizeSqm,
      price_eur: priceEur,
      furnishing,
      bathroom,
      outdoor,
      view,
    });
  }

  return parsed.sort((a, b) => a.index - b.index);
}

export function listingPriceRangeLabel(listing: Pick<Listing, "rent_eur" | "room_details">) {
  const roomDetails = listingRoomDetailsFromRow(listing);
  if (!roomDetails.length) {
    return `${listing.rent_eur} EUR/mois`;
  }

  const prices = roomDetails.map((room) => room.price_eur);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  if (minPrice === maxPrice) {
    return `${minPrice} EUR/mois`;
  }
  return `${minPrice}-${maxPrice} EUR/mois`;
}

export function listingRoomsSummary(listing: Pick<Listing, "available_rooms" | "total_rooms">) {
  if (listing.total_rooms > listing.available_rooms) {
    return `${listing.available_rooms} dispo / ${listing.total_rooms} chambres`;
  }
  return `${listing.available_rooms} chambre(s)`;
}

export function listingAnimalsPolicyLabel(policy: string | null | undefined) {
  if (!policy || !ANIMALS_POLICY_VALUES.has(policy)) {
    return null;
  }
  const labels = new Map(ANIMALS_POLICY_OPTIONS.map((item) => [item.value, item.label]));
  return labels.get(policy as AnimalsPolicy) ?? null;
}

export function listingCurrentFlatmatesLabel(value: string | null | undefined) {
  if (!value) return null;
  return CURRENT_FLATMATES_LABELS.get(value) ?? null;
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
