import locationsData from "@/lib/data/brussels-location-i18n.json";
import type { AppLocale } from "@/lib/i18n/locales";

type LocalizedLabels = Record<AppLocale, string>;
type MunicipalityLocation = {
  id: string;
  labels: LocalizedLabels;
  aliases?: string[];
};
type DistrictLocation = {
  id: string;
  municipalityId: string;
  labels: LocalizedLabels;
  aliases?: string[];
};

const MUNICIPALITIES = locationsData.municipalities as MunicipalityLocation[];
const DISTRICTS = locationsData.districts as DistrictLocation[];

export const LISTING_TYPE_OPTIONS = [
  { value: "colocation", label: "Colocation" },
  { value: "studio", label: "Studio" },
] as const;

export const OTHER_NEIGHBORHOOD_VALUE = "__other_neighborhood__";
export const OTHER_NEIGHBORHOOD_LABEL = "Autre quartier";

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const municipalityById = new Map(MUNICIPALITIES.map((municipality) => [municipality.id, municipality] as const));
const municipalityAliasToId = new Map<string, string>();
for (const municipality of MUNICIPALITIES) {
  const aliases = new Set([
    municipality.labels.fr,
    municipality.labels.nl,
    municipality.labels.en,
    ...(municipality.aliases ?? []),
  ]);
  if (municipality.id === "bruxelles-ville") {
    aliases.add("Bruxelles");
    aliases.add("Brussels");
    aliases.add("Brussel");
  }
  for (const alias of aliases) {
    municipalityAliasToId.set(normalizeKey(alias), municipality.id);
  }
}

const districtsByMunicipalityId = new Map<string, DistrictLocation[]>();
const districtAliasToIdByMunicipalityId = new Map<string, Map<string, string>>();
for (const district of DISTRICTS) {
  const byMunicipality = districtsByMunicipalityId.get(district.municipalityId) ?? [];
  byMunicipality.push(district);
  districtsByMunicipalityId.set(district.municipalityId, byMunicipality);

  const aliasToDistrictId = districtAliasToIdByMunicipalityId.get(district.municipalityId) ?? new Map<string, string>();
  const aliases = new Set([
    district.labels.fr,
    district.labels.nl,
    district.labels.en,
    ...(district.aliases ?? []),
  ]);
  for (const alias of aliases) {
    aliasToDistrictId.set(normalizeKey(alias), district.id);
  }
  districtAliasToIdByMunicipalityId.set(district.municipalityId, aliasToDistrictId);
}

function resolveMunicipalityId(commune: string) {
  return municipalityAliasToId.get(normalizeKey(commune)) ?? null;
}

function districtLabel(district: DistrictLocation, locale: AppLocale) {
  return district.labels[locale] ?? district.labels.fr;
}

function resolveDistrictId(municipalityId: string, neighborhood: string) {
  const aliasToDistrictId = districtAliasToIdByMunicipalityId.get(municipalityId);
  if (!aliasToDistrictId) return null;
  return aliasToDistrictId.get(normalizeKey(neighborhood)) ?? null;
}

export const BRUSSELS_COMMUNES = MUNICIPALITIES.map((municipality) => municipality.labels.fr);

export const BRUSSELS_NEIGHBORHOODS_BY_COMMUNE: Record<string, readonly string[]> = Object.fromEntries(
  MUNICIPALITIES.map((municipality) => {
    const neighborhoods = districtsByMunicipalityId.get(municipality.id) ?? [];
    return [municipality.labels.fr, neighborhoods.map((district) => district.labels.fr)];
  }),
);

export function getLocalizedCommuneLabel(commune: string, locale: AppLocale) {
  const municipalityId = resolveMunicipalityId(commune);
  if (!municipalityId) return commune;
  return municipalityById.get(municipalityId)?.labels[locale] ?? commune;
}

export function getCanonicalCommuneLabel(commune: string) {
  const municipalityId = resolveMunicipalityId(commune);
  if (!municipalityId) return commune;
  return municipalityById.get(municipalityId)?.labels.fr ?? commune;
}

export function getLocalizedCommuneOptions(locale: AppLocale) {
  return MUNICIPALITIES.map((municipality) => ({
    value: municipality.labels.fr,
    label: municipality.labels[locale] ?? municipality.labels.fr,
  }));
}

export function getNeighborhoodsForCommune(commune: string) {
  const municipalityId = resolveMunicipalityId(commune);
  if (!municipalityId) return [];
  const neighborhoods = districtsByMunicipalityId.get(municipalityId) ?? [];
  return neighborhoods.map((district) => district.labels.fr);
}

export function getLocalizedNeighborhoodLabel(commune: string, neighborhood: string, locale: AppLocale) {
  const municipalityId = resolveMunicipalityId(commune);
  if (!municipalityId) return neighborhood;
  const districtId = resolveDistrictId(municipalityId, neighborhood);
  if (!districtId) return neighborhood;
  const district = (districtsByMunicipalityId.get(municipalityId) ?? []).find((item) => item.id === districtId);
  if (!district) return neighborhood;
  return districtLabel(district, locale);
}

export function getCanonicalNeighborhoodLabel(commune: string, neighborhood: string) {
  const municipalityId = resolveMunicipalityId(commune);
  if (!municipalityId) return neighborhood;
  const districtId = resolveDistrictId(municipalityId, neighborhood);
  if (!districtId) return neighborhood;
  const district = (districtsByMunicipalityId.get(municipalityId) ?? []).find((item) => item.id === districtId);
  if (!district) return neighborhood;
  return district.labels.fr;
}

export function getLocalizedNeighborhoodOptionsForCommune(commune: string, locale: AppLocale) {
  const municipalityId = resolveMunicipalityId(commune);
  if (!municipalityId) return [];
  return (districtsByMunicipalityId.get(municipalityId) ?? []).map((district) => ({
    value: district.labels.fr,
    label: districtLabel(district, locale),
  }));
}

export function isValidNeighborhoodForCommune(commune: string, neighborhood: string) {
  const municipalityId = resolveMunicipalityId(commune);
  if (!municipalityId) return false;
  return Boolean(resolveDistrictId(municipalityId, neighborhood));
}

export function isOtherNeighborhoodValue(value: string) {
  return normalizeKey(value) === normalizeKey(OTHER_NEIGHBORHOOD_VALUE);
}

export const TRANSPORT_MODE_OPTIONS = [
  { value: "metro", label: "Métro" },
  { value: "tram", label: "Tram" },
  { value: "bus", label: "Bus" },
  { value: "train", label: "Train" },
] as const;

export const AREA_CONTEXT_OPTIONS = [
  { value: "commerces", label: "Proche des commerces" },
  { value: "residentiel", label: "Zone résidentielle" },
  { value: "anime", label: "Quartier animé" },
  { value: "calme", label: "Quartier calme" },
  { value: "vert", label: "Proche des espaces verts" },
] as const;

export const VIBE_TAG_OPTIONS = [
  { value: "calme", label: "Calme" },
  { value: "convivial", label: "Convivial" },
  { value: "sociable", label: "Sociable" },
  { value: "respect_intimite", label: "Respect de l'intimité" },
  { value: "teletravail", label: "Télétravail" },
  { value: "etudiants", label: "Étudiants" },
  { value: "jeunes_actifs", label: "Jeunes actifs" },
  { value: "no_smoking", label: "No smoking" },
  { value: "soirees_moderees", label: "Soirées modérées" },
] as const;

export const ANIMALS_POLICY_OPTIONS = [
  { value: "yes", label: "Oui" },
  { value: "no", label: "Non" },
  { value: "negotiable", label: "À discuter" },
] as const;

export const CURRENT_FLATMATES_OPTIONS = [
  { value: "mixte", label: "Mixte" },
  { value: "filles_only", label: "Filles only" },
  { value: "garcons_only", label: "Garcons only" },
  { value: "lgbt_only", label: "LGBT only" },
  { value: "non_precise", label: "Non précisé" },
] as const;

export const CANDIDATE_GENDER_PREFERENCE_OPTIONS = [
  { value: "non_precise", label: "Non précisé" },
  { value: "indifferent", label: "Indifférent" },
  { value: "fille_only", label: "Fille" },
  { value: "garcon_only", label: "Garçon" },
] as const;

export const ROOM_FURNISHING_OPTIONS = [
  { value: "furnished", label: "Meublé" },
  { value: "unfurnished", label: "Non meublé" },
  { value: "partially_furnished", label: "Partiellement meublé" },
] as const;

export const ROOM_BATHROOM_OPTIONS = [
  { value: "private", label: "SDB privative" },
  { value: "shared", label: "SDB partagée" },
] as const;

export const ROOM_OUTDOOR_OPTIONS = [
  { value: "balcony", label: "Balcon" },
  { value: "terrace", label: "Terrasse" },
  { value: "garden", label: "Jardin" },
  { value: "none", label: "Aucun" },
] as const;

export const ROOM_VIEW_OPTIONS = [
  { value: "garden", label: "Vue jardin" },
  { value: "courtyard", label: "Vue cour" },
  { value: "street", label: "Vue rue" },
  { value: "other", label: "Autre" },
] as const;

export const COMMON_SPACES_COLOCATION_OPTIONS = [
  { value: "salon", label: "Salon" },
  { value: "cuisine", label: "Cuisine équipée" },
  { value: "salle_a_manger", label: "Salle à manger" },
  { value: "buanderie", label: "Buanderie" },
  { value: "local_velos", label: "Local vélos" },
  { value: "terrasse", label: "Terrasse" },
  { value: "jardin", label: "Jardin" },
] as const;

export const COMMON_SPACES_STUDIO_OPTIONS = [
  { value: "coin_cuisine", label: "Coin cuisine" },
  { value: "salle_de_bain_privee", label: "Salle de bain privative" },
  { value: "buanderie", label: "Buanderie" },
  { value: "balcon", label: "Balcon" },
  { value: "terrasse", label: "Terrasse" },
  { value: "jardin", label: "Jardin" },
] as const;
