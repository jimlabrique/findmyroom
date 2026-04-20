import type { Database } from "@/lib/database.types";
import {
  ANIMALS_POLICY_OPTIONS,
  ROOM_BATHROOM_OPTIONS,
  ROOM_FURNISHING_OPTIONS,
  ROOM_OUTDOOR_OPTIONS,
  ROOM_VIEW_OPTIONS,
} from "@/lib/listing-form-options";

export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
export type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];
export type ListingPhoto = { url: string; caption: string };
export type ListingType = "colocation" | "studio";
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
const CURRENT_FLATMATES_LABELS: Record<"fr" | "en" | "nl", Record<string, string>> = {
  fr: {
    mixte: "Mixte",
    filles_only: "Filles only",
    garcons_only: "Garçons only",
    lgbt_only: "LGBT only",
    majorite_filles: "Filles only",
    majorite_garcons: "Garçons only",
  },
  en: {
    mixte: "Mixed",
    filles_only: "Women only",
    garcons_only: "Men only",
    lgbt_only: "LGBT only",
    majorite_filles: "Women only",
    majorite_garcons: "Men only",
  },
  nl: {
    mixte: "Gemengd",
    filles_only: "Alleen vrouwen",
    garcons_only: "Alleen mannen",
    lgbt_only: "LGBT only",
    majorite_filles: "Alleen vrouwen",
    majorite_garcons: "Alleen mannen",
  },
};

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

export function listingPriceRangeLabel(listing: Pick<Listing, "rent_eur" | "room_details">, locale: "fr" | "en" | "nl" = "fr") {
  const perMonthLabel = locale === "en" ? "EUR/month" : locale === "nl" ? "EUR/maand" : "EUR/mois";
  const roomDetails = listingRoomDetailsFromRow(listing);
  if (!roomDetails.length) {
    return `${listing.rent_eur} ${perMonthLabel}`;
  }

  const prices = roomDetails.map((room) => room.price_eur);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  if (minPrice === maxPrice) {
    return `${minPrice} ${perMonthLabel}`;
  }
  return `${minPrice}-${maxPrice} ${perMonthLabel}`;
}

export function listingRoomsSummary(
  listing: Pick<Listing, "available_rooms" | "total_rooms" | "listing_type">,
  locale: "fr" | "en" | "nl" = "fr",
) {
  if (listing.listing_type === "studio") {
    if (locale === "en") return "Studio for 1 person";
    if (locale === "nl") return "Studio voor 1 persoon";
    return "Studio 1 personne";
  }
  if (listing.total_rooms > listing.available_rooms) {
    if (locale === "en") return `${listing.available_rooms} available / ${listing.total_rooms} rooms`;
    if (locale === "nl") return `${listing.available_rooms} beschikbaar / ${listing.total_rooms} kamers`;
    return `${listing.available_rooms} dispo / ${listing.total_rooms} chambres`;
  }
  if (locale === "en") return `${listing.available_rooms} room(s)`;
  if (locale === "nl") return `${listing.available_rooms} kamer(s)`;
  return `${listing.available_rooms} chambre(s)`;
}

export function listingAnimalsPolicyLabel(policy: string | null | undefined, locale: "fr" | "en" | "nl" = "fr") {
  if (!policy || !ANIMALS_POLICY_VALUES.has(policy)) {
    return null;
  }
  const labels: Record<"fr" | "en" | "nl", Record<AnimalsPolicy, string>> = {
    fr: { yes: "Oui", no: "Non", negotiable: "À discuter" },
    en: { yes: "Yes", no: "No", negotiable: "Negotiable" },
    nl: { yes: "Ja", no: "Nee", negotiable: "Bespreekbaar" },
  };
  return labels[locale][policy as AnimalsPolicy] ?? null;
}

export function listingCurrentFlatmatesLabel(value: string | null | undefined, locale: "fr" | "en" | "nl" = "fr") {
  if (!value) return null;
  return CURRENT_FLATMATES_LABELS[locale][value] ?? null;
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
  locale: "fr" | "en" | "nl" = "fr",
): ListingContactOption[] {
  const options: ListingContactOption[] = [];

  if (listing.contact_whatsapp) {
    const digitsOnly = listing.contact_whatsapp.replace(/[^\d]/g, "");
    if (digitsOnly) {
      const intro =
        locale === "en"
          ? `Hello, I am interested in your listing "${listing.title}" in ${listing.city}.`
          : locale === "nl"
            ? `Hallo, ik ben geïnteresseerd in je advertentie "${listing.title}" in ${listing.city}.`
            : `Bonjour, je suis intéressé par votre annonce "${listing.title}" à ${listing.city}.`;
      const text = encodeURIComponent(
        intro,
      );
      options.push({
        method: "phone",
        href: `https://wa.me/${digitsOnly}?text=${text}`,
        label: locale === "en" ? "Message on WhatsApp" : locale === "nl" ? "Bericht via WhatsApp" : "Écrire sur WhatsApp",
        channelLabel: "WhatsApp",
      });
    }
  }

  if (listing.contact_email) {
    const subject = encodeURIComponent(
      locale === "en" ? `Flatshare listing: ${listing.title}` : locale === "nl" ? `Cohousing advertentie: ${listing.title}` : `Annonce coloc: ${listing.title}`,
    );
    const body = encodeURIComponent(
      locale === "en"
        ? `Hello,\n\nI am interested in your listing in ${listing.city}.\n`
        : locale === "nl"
          ? `Hallo,\n\nIk ben geïnteresseerd in je advertentie in ${listing.city}.\n`
          : `Bonjour,\n\nJe suis intéressé par votre annonce à ${listing.city}.\n`,
    );
    options.push({
      method: "email",
      href: `mailto:${listing.contact_email}?subject=${subject}&body=${body}`,
      label: locale === "en" ? "Send an email" : locale === "nl" ? "E-mail sturen" : "Envoyer un email",
      channelLabel: locale === "en" ? "Email" : locale === "nl" ? "E-mail" : "Email",
    });
  }

  return options;
}

export function makeContactHref(
  listing: Pick<Listing, "contact_whatsapp" | "contact_email" | "title" | "city">,
  locale: "fr" | "en" | "nl" = "fr",
) {
  return getListingContactOptions(listing, locale)[0]?.href ?? "#";
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

export function listingTypeLabel(type: string | null | undefined, locale: "fr" | "en" | "nl" = "fr") {
  if (locale === "en") {
    if (type === "studio") return "Studio";
    return "Shared flat";
  }
  if (locale === "nl") {
    if (type === "studio") return "Studio";
    return "Cohousing";
  }
  if (type === "studio") return "Studio";
  return "Colocation";
}

export function listingNeighborhoodFromHousingDescription(housingDescription: string | null | undefined) {
  const source = `${housingDescription ?? ""}`.trim();
  if (!source) return null;
  const lines = source.split(/\r?\n/);
  const neighborhoodLine = lines.find((line) => /^\s*quartier\s*:/i.test(line));
  if (!neighborhoodLine) return null;
  const rawNeighborhood = neighborhoodLine.replace(/^\s*quartier\s*:\s*/i, "").trim();
  if (!rawNeighborhood || /^non pr[ée]cis[ée]$/i.test(rawNeighborhood)) return null;
  return rawNeighborhood;
}

export function listingCandidatePreferenceFromFlatshareVibe(flatshareVibe: string | null | undefined) {
  const source = `${flatshareVibe ?? ""}`.trim();
  if (!source) return null;
  const lines = source.split(/\r?\n/);
  const preferenceLine = lines.find((line) => /^\s*profil recherch[ée]\s*:/i.test(line));
  if (!preferenceLine) return null;
  const rawPreference = preferenceLine.replace(/^\s*profil recherch[ée]\s*:\s*/i, "").trim();
  if (!rawPreference || /^non pr[ée]cis[ée]$/i.test(rawPreference)) return null;
  return rawPreference;
}
