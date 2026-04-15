import {
  ANIMALS_POLICY_OPTIONS,
  AREA_CONTEXT_OPTIONS,
  CURRENT_FLATMATES_OPTIONS,
  ROOM_BATHROOM_OPTIONS,
  ROOM_FURNISHING_OPTIONS,
  ROOM_OUTDOOR_OPTIONS,
  ROOM_VIEW_OPTIONS,
  TRANSPORT_MODE_OPTIONS,
  VIBE_TAG_OPTIONS,
} from "@/lib/listing-form-options";
import type { AnimalsPolicy, ListingRoomDetail } from "@/lib/listing";

function cleanText(value: string | null | undefined) {
  return `${value ?? ""}`.trim();
}

function distinct(values: string[]) {
  return Array.from(new Set(values));
}

function optionLabelMap(options: readonly { value: string; label: string }[]) {
  return new Map(options.map((option) => [option.value, option.label]));
}

export function sanitizeOptionValues(values: string[], allowedValues: readonly string[]) {
  const allowed = new Set(allowedValues);
  return distinct(
    values
      .map((value) => cleanText(value))
      .filter((value) => value.length > 0)
      .filter((value) => allowed.has(value)),
  );
}

function formatRoomCountLabel(roomCount: number) {
  return roomCount <= 1 ? "1 chambre" : `${roomCount} chambres`;
}

function normalizeRoomSizes(values: Array<number | string>) {
  return values
    .map((value) => Number.parseInt(`${value}`.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
}

export function formatRoomSizesLabel(values: Array<number | string>) {
  const sizes = normalizeRoomSizes(values);
  if (!sizes.length) {
    return "taille a preciser";
  }
  return sizes.map((size) => `${size}m2`).join(", ");
}

export function buildAutoListingTitle({
  commune,
  roomCount,
  roomSizesSqm,
  neighborhood,
}: {
  commune: string;
  roomCount: number;
  roomSizesSqm: Array<number | string>;
  neighborhood: string;
}) {
  const cleanCommune = cleanText(commune) || "Commune";
  const cleanNeighborhood = cleanText(neighborhood) || "Quartier a preciser";
  const roomCountLabel = formatRoomCountLabel(Math.max(1, roomCount));
  const roomSizesLabel = formatRoomSizesLabel(roomSizesSqm);
  return `${cleanCommune} - ${roomCountLabel} - ${roomSizesLabel} - ${cleanNeighborhood}`;
}

export function buildStructuredHousingDescription({
  neighborhood,
  roomDetails,
  transportModes,
  transportLines,
  areaContexts,
  extraDetails,
}: {
  neighborhood: string;
  roomDetails: ListingRoomDetail[];
  transportModes: string[];
  transportLines: string | null;
  areaContexts: string[];
  extraDetails: string | null;
}) {
  const transportLabels = optionLabelMap(TRANSPORT_MODE_OPTIONS);
  const areaLabels = optionLabelMap(AREA_CONTEXT_OPTIONS);
  const furnishingLabels = optionLabelMap(ROOM_FURNISHING_OPTIONS);
  const bathroomLabels = optionLabelMap(ROOM_BATHROOM_OPTIONS);
  const outdoorLabels = optionLabelMap(ROOM_OUTDOOR_OPTIONS);
  const viewLabels = optionLabelMap(ROOM_VIEW_OPTIONS);

  const safeNeighborhood = cleanText(neighborhood);
  const selectedTransport = transportModes
    .map((mode) => transportLabels.get(mode))
    .filter((label): label is string => Boolean(label));
  const selectedAreaContexts = areaContexts
    .map((context) => areaLabels.get(context))
    .filter((label): label is string => Boolean(label));

  const lines = [
    `Quartier: ${safeNeighborhood || "Non precise"}`,
    `Chambres disponibles: ${roomDetails.length}`,
    `Proche des transports en commun: ${selectedTransport.length ? selectedTransport.join(", ") : "Non precise"}`,
  ];

  if (roomDetails.length) {
    lines.push("");
    lines.push("Details par chambre:");
    for (const room of roomDetails) {
      const furnishing = furnishingLabels.get(room.furnishing) ?? room.furnishing;
      const bathroom = bathroomLabels.get(room.bathroom) ?? room.bathroom;
      const outdoor = outdoorLabels.get(room.outdoor) ?? room.outdoor;
      const view = viewLabels.get(room.view) ?? room.view;
      lines.push(
        `- Chambre ${room.index}: ${room.size_sqm}m2, ${room.price_eur} EUR/mois, ${furnishing}, ${bathroom}, ${outdoor}, ${view}`,
      );
    }
  }

  const safeTransportLines = cleanText(transportLines);
  if (safeTransportLines) {
    lines.push(`Lignes: ${safeTransportLines}`);
  }

  lines.push(`Environnement: ${selectedAreaContexts.length ? selectedAreaContexts.join(", ") : "Non precise"}`);

  const safeExtraDetails = cleanText(extraDetails);
  if (safeExtraDetails) {
    lines.push("");
    lines.push("Infos complementaires:");
    lines.push(safeExtraDetails);
  }

  return lines.join("\n");
}

export function buildStructuredFlatshareVibe({
  vibeTags,
  vibeOther,
  currentFlatmates,
  lgbtqFriendly,
  animalsPolicy,
}: {
  vibeTags: string[];
  vibeOther: string | null;
  currentFlatmates: string | null;
  lgbtqFriendly: boolean;
  animalsPolicy: AnimalsPolicy;
}) {
  const vibeLabels = optionLabelMap(VIBE_TAG_OPTIONS);
  const flatmatesLabels = optionLabelMap(CURRENT_FLATMATES_OPTIONS);
  const animalsLabels = optionLabelMap(ANIMALS_POLICY_OPTIONS);
  const selectedVibes = vibeTags
    .map((tag) => vibeLabels.get(tag))
    .filter((label): label is string => Boolean(label));

  const lines: string[] = [];
  lines.push(`Animaux autorises: ${animalsLabels.get(animalsPolicy) ?? animalsPolicy}`);
  lines.push(`LGBTQIA+ friendly: ${lgbtqFriendly ? "Oui" : "Non"}`);

  const safeFlatmates = cleanText(currentFlatmates);
  if (safeFlatmates) {
    lines.push(`Coloc actuelle: ${flatmatesLabels.get(safeFlatmates) ?? safeFlatmates}`);
  }

  if (selectedVibes.length) {
    lines.push(`Ambiance: ${selectedVibes.join(", ")}`);
  }

  const safeOther = cleanText(vibeOther);
  if (safeOther) {
    lines.push(`Autre: ${safeOther}`);
  }

  return lines.join("\n").trim();
}
