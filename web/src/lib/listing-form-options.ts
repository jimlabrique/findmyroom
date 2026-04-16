export const BRUSSELS_COMMUNES = [
  "Ixelles",
  "Saint-Gilles",
  "Bruxelles-Ville",
  "Etterbeek",
  "Schaerbeek",
  "Forest",
  "Uccle",
  "Woluwe-Saint-Lambert",
  "Woluwe-Saint-Pierre",
  "Auderghem",
  "Watermael-Boitsfort",
  "Anderlecht",
  "Molenbeek-Saint-Jean",
  "Jette",
  "Evere",
  "Saint-Josse-ten-Noode",
  "Koekelberg",
  "Ganshoren",
  "Berchem-Sainte-Agathe",
] as const;

export const LISTING_TYPE_OPTIONS = [
  { value: "colocation", label: "Colocation" },
  { value: "studio", label: "Studio" },
] as const;

export const OTHER_NEIGHBORHOOD_VALUE = "__other_neighborhood__";
export const OTHER_NEIGHBORHOOD_LABEL = "Autre quartier";

export const BRUSSELS_NEIGHBORHOODS_BY_COMMUNE: Record<string, readonly string[]> = {
  Ixelles: [
    "Flagey",
    "Étangs d'Ixelles",
    "Châtelain",
    "Bailli",
    "Brugmann",
    "Cimetière d'Ixelles",
    "ULB Solbosch",
    "ULB Plaine",
    "Porte de Namur",
    "Toison d'Or",
    "Matonge",
    "Saint-Boniface",
    "Fernand Cocq",
    "Vleurgat",
    "Tenbosch",
    "Malibran",
    "Boondael",
    "La Cambre",
    "Abbaye de la Cambre",
    "Berkendael",
    "Louise",
    "Luxembourg",
  ],
  "Saint-Gilles": [
    "Parvis de Saint-Gilles",
    "Barrière de Saint-Gilles",
    "Ma Campagne",
    "Hôtel des Monnaies",
    "Janson",
    "Morichar",
    "Chaussée de Waterloo",
    "Porte de Hal",
    "Louise",
  ],
  "Bruxelles-Ville": [
    "Centre",
    "Grand-Place",
    "De Brouckere",
    "Sainte-Catherine",
    "Dansaert",
    "Sablon",
    "Marolles",
    "Mont des Arts",
    "Quartier Royal",
    "Quartier Européen",
    "Schuman",
    "Madou",
    "Yser",
    "Anneessens",
    "Canal",
    "Tour et Taxis",
    "Laeken",
    "Neder-Over-Heembeek",
    "Haren",
  ],
  Bruxelles: [
    "Centre",
    "Grand-Place",
    "De Brouckere",
    "Sainte-Catherine",
    "Dansaert",
    "Sablon",
    "Marolles",
    "Mont des Arts",
    "Quartier Royal",
    "Quartier Européen",
    "Schuman",
    "Madou",
    "Yser",
    "Anneessens",
    "Canal",
    "Tour et Taxis",
    "Laeken",
    "Neder-Over-Heembeek",
    "Haren",
  ],
  Etterbeek: ["Jourdan", "Saint-Antoine", "La Chasse", "Thieffry", "Cinquantenaire", "Petillon", "Montgomery"],
  Schaerbeek: ["Plasky", "Dailly", "Meiser", "Helmet", "Josaphat", "Diamant", "Colignon", "Cage aux Ours", "Reyers"],
  Forest: ["Altitude 100", "Wiels", "Saint-Denis", "Forest National", "Bervoets", "Van Volxem"],
  Uccle: ["Bascule", "Churchill", "Fort Jaco", "Observatoire", "Saint-Job", "Calevoet", "Prince d'Orange", "Globe", "Vivier d'Oie"],
  "Woluwe-Saint-Lambert": ["Tomberg", "Roodebeek", "Georges Henri", "Gribaumont", "Kapelleveld", "Alma", "Vandervelde"],
  "Woluwe-Saint-Pierre": ["Stockel", "Montgomery", "Chant d'Oiseau", "Joli-Bois", "Parc de Woluwe"],
  Auderghem: ["Hankar", "Delta", "Chant d'Oiseau", "Val Duchesse", "Transvaal"],
  "Watermael-Boitsfort": ["Boitsfort", "Watermael", "Le Logis", "Floréal", "Keym", "Wiener", "Archiducs", "Trois Tilleuls"],
  Anderlecht: ["Cureghem", "Aumale", "Saint-Guidon", "Veeweyde", "La Roue", "Neerpede"],
  "Molenbeek-Saint-Jean": ["Comte de Flandre", "Étangs Noirs", "Osseghem", "Karreveld", "Quartier Maritime", "Beekkant"],
  Jette: ["Dieleghem", "Esseghem", "Place Cardinal Mercier", "Hôpital Brugmann"],
  Evere: ["Paduwa", "Bordet", "Genève"],
  "Saint-Josse-ten-Noode": ["Madou", "Place Saint-Josse", "Botanique"],
  Koekelberg: ["Basilique", "Simonis"],
  Ganshoren: ["Place du Miroir", "Charles Quint"],
  "Berchem-Sainte-Agathe": ["Schweitzer", "Hunderenveld"],
};

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

export function getNeighborhoodsForCommune(commune: string) {
  return BRUSSELS_NEIGHBORHOODS_BY_COMMUNE[commune] ?? [];
}

export function isValidNeighborhoodForCommune(commune: string, neighborhood: string) {
  const communeNeighborhoods = getNeighborhoodsForCommune(commune);
  if (!communeNeighborhoods.length) return false;
  const needle = normalizeKey(neighborhood);
  return communeNeighborhoods.some((candidate) => normalizeKey(candidate) === needle);
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

export const ROOM_FURNISHING_OPTIONS = [
  { value: "furnished", label: "Meublée" },
  { value: "unfurnished", label: "Non meublée" },
  { value: "partially_furnished", label: "Partiellement meublée" },
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
