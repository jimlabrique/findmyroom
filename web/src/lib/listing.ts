import type { Database } from "@/lib/database.types";
import {
  ANIMALS_POLICY_OPTIONS,
  getLocalizedCommuneLabel,
  getLocalizedNeighborhoodLabel,
  ROOM_BATHROOM_OPTIONS,
  ROOM_FURNISHING_OPTIONS,
  ROOM_OUTDOOR_OPTIONS,
  ROOM_VIEW_OPTIONS,
} from "@/lib/listing-form-options";
import { buildAutoListingTitle } from "@/lib/listing-composer";

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

type I18nLabelMap = Record<string, Record<"fr" | "en" | "nl", string>>;

const LISTING_TYPE_LABELS: I18nLabelMap = {
  colocation: { fr: "Colocation", en: "Shared flat", nl: "Cohousing" },
  studio: { fr: "Studio", en: "Studio", nl: "Studio" },
};

const ROOM_FURNISHING_LABELS: I18nLabelMap = {
  furnished: { fr: "Meublé", en: "Furnished", nl: "Gemeubileerd" },
  unfurnished: { fr: "Non meublé", en: "Unfurnished", nl: "Niet gemeubileerd" },
  partially_furnished: { fr: "Partiellement meublé", en: "Partially furnished", nl: "Deels gemeubileerd" },
};

const ROOM_BATHROOM_LABELS: I18nLabelMap = {
  private: { fr: "SDB privative", en: "Private bathroom", nl: "Privébadkamer" },
  shared: { fr: "SDB partagée", en: "Shared bathroom", nl: "Gedeelde badkamer" },
};

const ROOM_OUTDOOR_LABELS: I18nLabelMap = {
  balcony: { fr: "Balcon", en: "Balcony", nl: "Balkon" },
  terrace: { fr: "Terrasse", en: "Terrace", nl: "Terras" },
  garden: { fr: "Jardin", en: "Garden", nl: "Tuin" },
  none: { fr: "Aucun", en: "None", nl: "Geen" },
};

const ROOM_VIEW_LABELS: I18nLabelMap = {
  street: { fr: "Vue rue", en: "Street view", nl: "Uitzicht op straat" },
  garden: { fr: "Vue jardin", en: "Garden view", nl: "Uitzicht op tuin" },
  courtyard: { fr: "Vue cour", en: "Courtyard view", nl: "Uitzicht op binnenplaats" },
  other: { fr: "Autre", en: "Other", nl: "Andere" },
};

const ANIMALS_POLICY_LABELS: I18nLabelMap = {
  yes: { fr: "Oui", en: "Yes", nl: "Ja" },
  no: { fr: "Non", en: "No", nl: "Nee" },
  negotiable: { fr: "À discuter", en: "Negotiable", nl: "Bespreekbaar" },
};

const TRANSPORT_LABELS: I18nLabelMap = {
  metro: { fr: "Métro", en: "Metro", nl: "Metro" },
  tram: { fr: "Tram", en: "Tram", nl: "Tram" },
  bus: { fr: "Bus", en: "Bus", nl: "Bus" },
  train: { fr: "Train", en: "Train", nl: "Trein" },
};

const AREA_CONTEXT_LABELS: I18nLabelMap = {
  commerces: { fr: "Proche des commerces", en: "Near shops", nl: "Dicht bij winkels" },
  residentiel: { fr: "Zone résidentielle", en: "Residential area", nl: "Residentiële buurt" },
  anime: { fr: "Quartier animé", en: "Lively area", nl: "Levendige wijk" },
  calme: { fr: "Quartier calme", en: "Quiet area", nl: "Rustige wijk" },
  vert: { fr: "Proche des espaces verts", en: "Near green spaces", nl: "Dicht bij groene zones" },
};

const VIBE_LABELS: I18nLabelMap = {
  calme: { fr: "Calme", en: "Calm", nl: "Rustig" },
  convivial: { fr: "Convivial", en: "Friendly", nl: "Gezellig" },
  sociable: { fr: "Sociable", en: "Sociable", nl: "Sociaal" },
  respect_intimite: { fr: "Respect de l'intimité", en: "Respects privacy", nl: "Respect voor privacy" },
  teletravail: { fr: "Télétravail", en: "Remote work", nl: "Thuiswerk" },
  etudiants: { fr: "Étudiants", en: "Students", nl: "Studenten" },
  jeunes_actifs: { fr: "Jeunes actifs", en: "Young professionals", nl: "Jonge werkenden" },
  no_smoking: { fr: "No smoking", en: "No smoking", nl: "Niet-roken" },
  soirees_moderees: { fr: "Soirées modérées", en: "Moderate parties", nl: "Gematigde feestjes" },
};

const COMMON_SPACES_LABELS: I18nLabelMap = {
  salon: { fr: "Salon", en: "Living room", nl: "Woonkamer" },
  cuisine: { fr: "Cuisine équipée", en: "Equipped kitchen", nl: "Ingerichte keuken" },
  salle_a_manger: { fr: "Salle à manger", en: "Dining room", nl: "Eetkamer" },
  buanderie: { fr: "Buanderie", en: "Laundry room", nl: "Wasruimte" },
  local_velos: { fr: "Local vélos", en: "Bike storage", nl: "Fietsenberging" },
  terrasse: { fr: "Terrasse", en: "Terrace", nl: "Terras" },
  jardin: { fr: "Jardin", en: "Garden", nl: "Tuin" },
  coin_cuisine: { fr: "Coin cuisine", en: "Kitchenette", nl: "Kitchenette" },
  salle_de_bain_privee: { fr: "Salle de bain privative", en: "Private bathroom", nl: "Privébadkamer" },
  balcon: { fr: "Balcon", en: "Balcony", nl: "Balkon" },
};

const CURRENT_FLATMATES_VALUE_LABELS: I18nLabelMap = {
  mixte: { fr: "Mixte", en: "Mixed", nl: "Gemengd" },
  filles_only: { fr: "Filles only", en: "Women only", nl: "Alleen vrouwen" },
  garcons_only: { fr: "Garçons only", en: "Men only", nl: "Alleen mannen" },
  lgbt_only: { fr: "LGBT only", en: "LGBT only", nl: "LGBT only" },
  non_precise: { fr: "Non précisé", en: "Not specified", nl: "Niet gespecificeerd" },
};

const CANDIDATE_GENDER_LABELS: I18nLabelMap = {
  non_precise: { fr: "Non précisé", en: "Not specified", nl: "Niet gespecificeerd" },
  indifferent: { fr: "Indifférent", en: "No preference", nl: "Geen voorkeur" },
  fille_only: { fr: "Fille", en: "Woman", nl: "Vrouw" },
  garcon_only: { fr: "Garçon", en: "Man", nl: "Man" },
};

const HOUSING_PREFIX_LABELS: Record<
  "type" | "neighborhood" | "availableRooms" | "transportNearby" | "roomDetails" | "lines" | "environment" | "commonSpaces" | "otherCommonSpaces" | "extraInfo",
  Record<"fr" | "en" | "nl", string>
> = {
  type: { fr: "Type", en: "Type", nl: "Type" },
  neighborhood: { fr: "Quartier", en: "Neighborhood", nl: "Wijk" },
  availableRooms: { fr: "Chambres disponibles", en: "Available rooms", nl: "Beschikbare kamers" },
  transportNearby: { fr: "Proche des transports en commun", en: "Close to public transport", nl: "Dicht bij openbaar vervoer" },
  roomDetails: { fr: "Détails par chambre", en: "Room details", nl: "Details per kamer" },
  lines: { fr: "Lignes", en: "Lines", nl: "Lijnen" },
  environment: { fr: "Environnement", en: "Area", nl: "Omgeving" },
  commonSpaces: { fr: "Parties communes", en: "Shared spaces", nl: "Gedeelde ruimtes" },
  otherCommonSpaces: {
    fr: "Autre (parties communes)",
    en: "Other (shared spaces)",
    nl: "Andere (gedeelde ruimtes)",
  },
  extraInfo: { fr: "Infos complémentaires", en: "Additional information", nl: "Extra info" },
};

const VIBE_PREFIX_LABELS: Record<
  "animals" | "flatshareType" | "profile" | "vibe" | "other",
  Record<"fr" | "en" | "nl", string>
> = {
  animals: { fr: "Animaux autorisés", en: "Pets allowed", nl: "Huisdieren toegestaan" },
  flatshareType: { fr: "Type de coloc", en: "Flatshare type", nl: "Type cohousing" },
  profile: { fr: "Profil recherché", en: "Preferred profile", nl: "Gezocht profiel" },
  vibe: { fr: "Ambiance", en: "Vibe", nl: "Sfeer" },
  other: { fr: "Autre", en: "Other", nl: "Andere" },
};

function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function labelMapFor(optionMap: I18nLabelMap) {
  const reverse = new Map<string, string>();
  for (const [value, labels] of Object.entries(optionMap)) {
    reverse.set(normalizeLabel(value), value);
    reverse.set(normalizeLabel(labels.fr), value);
    reverse.set(normalizeLabel(labels.en), value);
    reverse.set(normalizeLabel(labels.nl), value);
  }
  return reverse;
}

const TRANSPORT_LABEL_TO_VALUE = labelMapFor(TRANSPORT_LABELS);
const AREA_CONTEXT_LABEL_TO_VALUE = labelMapFor(AREA_CONTEXT_LABELS);
const COMMON_SPACES_LABEL_TO_VALUE = labelMapFor(COMMON_SPACES_LABELS);
const VIBE_LABEL_TO_VALUE = labelMapFor(VIBE_LABELS);
const CURRENT_FLATMATES_LABEL_TO_VALUE = labelMapFor(CURRENT_FLATMATES_VALUE_LABELS);
const CANDIDATE_GENDER_LABEL_TO_VALUE = labelMapFor(CANDIDATE_GENDER_LABELS);
const ROOM_FURNISHING_LABEL_TO_VALUE = labelMapFor(ROOM_FURNISHING_LABELS);
const ROOM_OUTDOOR_LABEL_TO_VALUE = labelMapFor(ROOM_OUTDOOR_LABELS);
const ANIMALS_POLICY_LABEL_TO_VALUE = labelMapFor(ANIMALS_POLICY_LABELS);

function mapCsvByDictionary(csv: string, reverseMap: Map<string, string>, labels: I18nLabelMap, locale: "fr" | "en" | "nl") {
  const values = csv
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => reverseMap.get(normalizeLabel(item)))
    .filter((item): item is string => Boolean(item));
  if (!values.length) return csv;
  return values.map((value) => labels[value]?.[locale] ?? value).join(", ");
}

function localizedLabel(optionMap: I18nLabelMap, value: string, locale: "fr" | "en" | "nl") {
  const resolvedValue = labelMapFor(optionMap).get(normalizeLabel(value)) ?? value;
  return optionMap[resolvedValue]?.[locale] ?? value;
}

export function localizeHousingDescriptionText(
  source: string,
  locale: "fr" | "en" | "nl",
  commune: string,
) {
  if (locale === "fr") return source;
  const lines = source.split(/\r?\n/);
  const mappedLines = lines.map((line) => {
    if (/^\s*Type\s*:/i.test(line)) {
      const value = line.replace(/^\s*Type\s*:\s*/i, "");
      return `${HOUSING_PREFIX_LABELS.type[locale]}: ${localizedLabel(LISTING_TYPE_LABELS, value, locale)}`;
    }
    if (/^\s*Quartier\s*:/i.test(line)) {
      const value = line.replace(/^\s*Quartier\s*:\s*/i, "");
      return `${HOUSING_PREFIX_LABELS.neighborhood[locale]}: ${getLocalizedNeighborhoodLabel(commune, value, locale)}`;
    }
    if (/^\s*Chambres disponibles\s*:/i.test(line)) {
      const value = line.replace(/^\s*Chambres disponibles\s*:\s*/i, "");
      return `${HOUSING_PREFIX_LABELS.availableRooms[locale]}: ${value}`;
    }
    if (/^\s*Proche des transports en commun\s*:/i.test(line)) {
      const value = line.replace(/^\s*Proche des transports en commun\s*:\s*/i, "");
      return `${HOUSING_PREFIX_LABELS.transportNearby[locale]}: ${mapCsvByDictionary(value, TRANSPORT_LABEL_TO_VALUE, TRANSPORT_LABELS, locale)}`;
    }
    if (/^\s*Détails par chambre\s*:/i.test(line)) {
      return `${HOUSING_PREFIX_LABELS.roomDetails[locale]}:`;
    }
    if (/^\s*-\s*Chambre\s+(\d+)\s*:/i.test(line)) {
      const match = line.match(/^\s*-\s*Chambre\s+(\d+)\s*:\s*(.+)$/i);
      if (!match) return line;
      const roomIndex = match[1];
      const segments = match[2]
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const translatedSegments = segments.map((segment) => {
        if (/^(\d+)\s*EUR\/mois$/i.test(segment)) {
          const amount = segment.replace(/^(\d+)\s*EUR\/mois$/i, "$1");
          return locale === "en" ? `${amount} EUR/month` : locale === "nl" ? `${amount} EUR/maand` : `${amount} EUR/mois`;
        }
        if (/^Vue\s+/i.test(segment) || segment === "Autre") {
          return localizedLabel(ROOM_VIEW_LABELS, segment, locale);
        }
        if (/^SDB\s+/i.test(segment)) {
          return localizedLabel(ROOM_BATHROOM_LABELS, segment, locale);
        }
        if (ROOM_FURNISHING_LABEL_TO_VALUE.has(normalizeLabel(segment))) {
          return localizedLabel(ROOM_FURNISHING_LABELS, segment, locale);
        }
        if (ROOM_OUTDOOR_LABEL_TO_VALUE.has(normalizeLabel(segment))) {
          return localizedLabel(ROOM_OUTDOOR_LABELS, segment, locale);
        }
        return segment;
      });
      const roomPrefix = locale === "en" ? "Room" : locale === "nl" ? "Kamer" : "Chambre";
      return `- ${roomPrefix} ${roomIndex}: ${translatedSegments.join(", ")}`;
    }
    if (/^\s*Lignes\s*:/i.test(line)) {
      const value = line.replace(/^\s*Lignes\s*:\s*/i, "");
      return `${HOUSING_PREFIX_LABELS.lines[locale]}: ${value}`;
    }
    if (/^\s*Environnement\s*:/i.test(line)) {
      const value = line.replace(/^\s*Environnement\s*:\s*/i, "");
      return `${HOUSING_PREFIX_LABELS.environment[locale]}: ${mapCsvByDictionary(value, AREA_CONTEXT_LABEL_TO_VALUE, AREA_CONTEXT_LABELS, locale)}`;
    }
    if (/^\s*Parties communes\s*:/i.test(line) || /^\s*[ÉE]quipements\s*\/\s*parties communes\s*:/i.test(line)) {
      const value = line.replace(/^\s*(Parties communes|[ÉE]quipements\s*\/\s*parties communes)\s*:\s*/i, "");
      return `${HOUSING_PREFIX_LABELS.commonSpaces[locale]}: ${mapCsvByDictionary(value, COMMON_SPACES_LABEL_TO_VALUE, COMMON_SPACES_LABELS, locale)}`;
    }
    if (/^\s*Autre\s*\(parties communes\)\s*:/i.test(line)) {
      const value = line.replace(/^\s*Autre\s*\(parties communes\)\s*:\s*/i, "");
      return `${HOUSING_PREFIX_LABELS.otherCommonSpaces[locale]}: ${value}`;
    }
    if (/^\s*Infos compl[ée]mentaires\s*:/i.test(line)) {
      return `${HOUSING_PREFIX_LABELS.extraInfo[locale]}:`;
    }
    return line;
  });

  return mappedLines.join("\n");
}

export function localizeFlatshareVibeText(source: string, locale: "fr" | "en" | "nl") {
  if (locale === "fr") return source;
  const lines = source.split(/\r?\n/);
  const mappedLines = lines.map((line) => {
    if (/^\s*Animaux autoris[ée]s\s*:/i.test(line)) {
      const value = line.replace(/^\s*Animaux autoris[ée]s\s*:\s*/i, "");
      const mappedValue = ANIMALS_POLICY_LABEL_TO_VALUE.get(normalizeLabel(value)) ?? value;
      return `${VIBE_PREFIX_LABELS.animals[locale]}: ${ANIMALS_POLICY_LABELS[mappedValue]?.[locale] ?? value}`;
    }
    if (/^\s*Type de coloc\s*:/i.test(line)) {
      const value = line.replace(/^\s*Type de coloc\s*:\s*/i, "");
      const mappedValue = CURRENT_FLATMATES_LABEL_TO_VALUE.get(normalizeLabel(value)) ?? value;
      return `${VIBE_PREFIX_LABELS.flatshareType[locale]}: ${CURRENT_FLATMATES_VALUE_LABELS[mappedValue]?.[locale] ?? value}`;
    }
    if (/^\s*Profil recherch[ée]\s*:/i.test(line)) {
      const value = line.replace(/^\s*Profil recherch[ée]\s*:\s*/i, "");
      const mappedValue = CANDIDATE_GENDER_LABEL_TO_VALUE.get(normalizeLabel(value)) ?? value;
      return `${VIBE_PREFIX_LABELS.profile[locale]}: ${CANDIDATE_GENDER_LABELS[mappedValue]?.[locale] ?? value}`;
    }
    if (/^\s*Ambiance\s*:/i.test(line)) {
      const value = line.replace(/^\s*Ambiance\s*:\s*/i, "");
      return `${VIBE_PREFIX_LABELS.vibe[locale]}: ${mapCsvByDictionary(value, VIBE_LABEL_TO_VALUE, VIBE_LABELS, locale)}`;
    }
    if (/^\s*Autre\s*:/i.test(line)) {
      const value = line.replace(/^\s*Autre\s*:\s*/i, "");
      return `${VIBE_PREFIX_LABELS.other[locale]}: ${value}`;
    }
    return line;
  });
  return mappedLines.join("\n");
}
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

export function listingDisplayTitle(
  listing: Pick<Listing, "title" | "city" | "listing_type" | "available_rooms" | "room_details" | "housing_description">,
  locale: "fr" | "en" | "nl" = "fr",
) {
  const roomDetails = listingRoomDetailsFromRow(listing);
  const neighborhood = listingNeighborhoodFromHousingDescription(listing.housing_description) ?? "";
  const generated = buildAutoListingTitle({
    listingType: listing.listing_type === "studio" ? "studio" : "colocation",
    commune: getLocalizedCommuneLabel(listing.city, locale),
    roomCount: listing.listing_type === "studio" ? 1 : listing.available_rooms,
    roomSizesSqm: roomDetails.map((room) => room.size_sqm),
    neighborhood: neighborhood ? getLocalizedNeighborhoodLabel(listing.city, neighborhood, locale) : neighborhood,
    locale,
  });

  return generated || listing.title;
}

export function listingAnimalsPolicyLabel(policy: string | null | undefined, locale: "fr" | "en" | "nl" = "fr") {
  if (!policy || !ANIMALS_POLICY_VALUES.has(policy)) {
    return null;
  }
  return ANIMALS_POLICY_LABELS[policy]?.[locale] ?? null;
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

export function listingCandidatePreferenceFromFlatshareVibe(
  flatshareVibe: string | null | undefined,
  locale: "fr" | "en" | "nl" = "fr",
) {
  const source = `${flatshareVibe ?? ""}`.trim();
  if (!source) return null;
  const lines = source.split(/\r?\n/);
  const preferenceLine = lines.find((line) => /^\s*profil recherch[ée]\s*:/i.test(line));
  if (!preferenceLine) return null;
  const rawPreference = preferenceLine.replace(/^\s*profil recherch[ée]\s*:\s*/i, "").trim();
  if (!rawPreference || /^non pr[ée]cis[ée]$/i.test(rawPreference)) return null;
  const mappedValue = CANDIDATE_GENDER_LABEL_TO_VALUE.get(normalizeLabel(rawPreference)) ?? rawPreference;
  return CANDIDATE_GENDER_LABELS[mappedValue]?.[locale] ?? rawPreference;
}

export function listingCandidatePreferenceValueFromFlatshareVibe(
  flatshareVibe: string | null | undefined,
): "non_precise" | "indifferent" | "fille_only" | "garcon_only" | null {
  const source = `${flatshareVibe ?? ""}`.trim();
  if (!source) return null;
  const lines = source.split(/\r?\n/);
  const preferenceLine = lines.find((line) => /^\s*profil recherch[ée]\s*:/i.test(line));
  if (!preferenceLine) return null;
  const rawPreference = preferenceLine.replace(/^\s*profil recherch[ée]\s*:\s*/i, "").trim();
  if (!rawPreference || /^non pr[ée]cis[ée]$/i.test(rawPreference)) return null;
  const mappedValue = CANDIDATE_GENDER_LABEL_TO_VALUE.get(normalizeLabel(rawPreference));
  if (!mappedValue) return null;
  if (mappedValue === "non_precise" || mappedValue === "indifferent" || mappedValue === "fille_only" || mappedValue === "garcon_only") {
    return mappedValue;
  }
  return null;
}
