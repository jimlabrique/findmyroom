export const BRUSSELS_COMMUNES = [
  "Anderlecht",
  "Auderghem",
  "Berchem-Sainte-Agathe",
  "Bruxelles",
  "Etterbeek",
  "Evere",
  "Forest",
  "Ganshoren",
  "Ixelles",
  "Jette",
  "Koekelberg",
  "Molenbeek-Saint-Jean",
  "Saint-Gilles",
  "Saint-Josse-ten-Noode",
  "Schaerbeek",
  "Uccle",
  "Watermael-Boitsfort",
  "Woluwe-Saint-Lambert",
  "Woluwe-Saint-Pierre",
] as const;

export const TRANSPORT_MODE_OPTIONS = [
  { value: "metro", label: "Metro" },
  { value: "tram", label: "Tram" },
  { value: "bus", label: "Bus" },
  { value: "train", label: "Train" },
] as const;

export const AREA_CONTEXT_OPTIONS = [
  { value: "commerces", label: "Proche des commerces" },
  { value: "residentiel", label: "Zone residentielle" },
  { value: "anime", label: "Quartier anime" },
  { value: "calme", label: "Quartier calme" },
  { value: "vert", label: "Proche des espaces verts" },
] as const;

export const VIBE_TAG_OPTIONS = [
  { value: "calme", label: "Calme" },
  { value: "convivial", label: "Convivial" },
  { value: "sociable", label: "Sociable" },
  { value: "respect_intimite", label: "Respect de l'intimite" },
  { value: "teletravail", label: "Teletravail" },
  { value: "etudiants", label: "Etudiants" },
  { value: "jeunes_actifs", label: "Jeunes actifs" },
  { value: "no_smoking", label: "No smoking" },
  { value: "soirees_moderees", label: "Soirees moderees" },
] as const;

export const ANIMALS_POLICY_OPTIONS = [
  { value: "yes", label: "Oui" },
  { value: "no", label: "Non" },
  { value: "negotiable", label: "A discuter" },
] as const;

export const CURRENT_FLATMATES_OPTIONS = [
  { value: "mixte", label: "Mixte" },
  { value: "majorite_filles", label: "Majorite filles" },
  { value: "majorite_garcons", label: "Majorite garcons" },
  { value: "non_precise", label: "Non precise" },
] as const;

export const ROOM_FURNISHING_OPTIONS = [
  { value: "furnished", label: "Meublee" },
  { value: "unfurnished", label: "Non meublee" },
  { value: "partially_furnished", label: "Partiellement meublee" },
] as const;

export const ROOM_BATHROOM_OPTIONS = [
  { value: "private", label: "SDB privative" },
  { value: "shared", label: "SDB partagee" },
] as const;

export const ROOM_OUTDOOR_OPTIONS = [
  { value: "balcony", label: "Balcon" },
  { value: "terrace", label: "Terrasse" },
  { value: "none", label: "Aucun" },
] as const;

export const ROOM_VIEW_OPTIONS = [
  { value: "garden", label: "Vue jardin" },
  { value: "courtyard", label: "Vue cour" },
  { value: "street", label: "Vue rue" },
  { value: "other", label: "Autre" },
] as const;
