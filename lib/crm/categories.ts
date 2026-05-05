export type OsmTag = { key: string; value: string };

export type CategoryDefinition = {
  id: string;
  label: string;
  group: string;
  description: string;
  osmTags: OsmTag[];
  priority: number;
  defaultEnabled: boolean;
  idealForColdAcquisition: boolean;
  notes?: string;
};

const cat = (
  id: string,
  label: string,
  group: string,
  osmTags: OsmTag[],
  priority: number,
  ideal = true,
  defaultEnabled = false,
  notes?: string
): CategoryDefinition => ({
  id,
  label,
  group,
  description: `${label} aus ${group}`,
  osmTags,
  priority,
  defaultEnabled,
  idealForColdAcquisition: ideal,
  notes
});

export const categoryRegistry: CategoryDefinition[] = [
  cat("bakery", "Bäckerei", "Essen & Trinken", [{ key: "shop", value: "bakery" }], 1, true, true),
  cat("cafe", "Café", "Essen & Trinken", [{ key: "amenity", value: "cafe" }], 2, true, true),
  cat("restaurant", "Restaurant", "Essen & Trinken", [{ key: "amenity", value: "restaurant" }], 3, true, true),
  cat("ice_cream", "Eisdiele", "Essen & Trinken", [{ key: "amenity", value: "ice_cream" }], 4),
  cat("butcher", "Metzgerei", "Essen & Trinken", [{ key: "shop", value: "butcher" }], 4),
  cat("fast_food", "Imbiss", "Essen & Trinken", [{ key: "amenity", value: "fast_food" }], 5),
  cat("pizzeria", "Pizzeria", "Essen & Trinken", [{ key: "cuisine", value: "pizza" }, { key: "amenity", value: "restaurant" }], 5),
  cat("bar", "Bar", "Essen & Trinken", [{ key: "amenity", value: "bar" }], 6, false),
  cat("catering", "Catering", "Essen & Trinken", [{ key: "shop", value: "catering" }, { key: "craft", value: "caterer" }], 5),
  cat("fitness", "Fitnessstudio", "Fitness & Gesundheit", [{ key: "leisure", value: "fitness_centre" }], 2, true, true),
  cat("yoga", "Yoga Studio", "Fitness & Gesundheit", [{ key: "sport", value: "yoga" }], 4),
  cat("physio", "Physiotherapie", "Fitness & Gesundheit", [{ key: "healthcare", value: "physiotherapist" }], 2),
  cat("pharmacy", "Apotheke", "Fitness & Gesundheit", [{ key: "amenity", value: "pharmacy" }], 5, false),
  cat("medical_supply", "Sanitätshaus", "Fitness & Gesundheit", [{ key: "shop", value: "medical_supply" }], 3),
  cat("dentist", "Zahnarzt", "Fitness & Gesundheit", [{ key: "amenity", value: "dentist" }, { key: "healthcare", value: "dentist" }], 4),
  cat("doctor", "Arztpraxis", "Fitness & Gesundheit", [{ key: "amenity", value: "doctors" }, { key: "healthcare", value: "doctor" }], 5, false),
  cat("ergotherapy", "Ergotherapie", "Fitness & Gesundheit", [{ key: "healthcare", value: "occupational_therapist" }], 3),
  cat("hairdresser", "Friseur", "Beauty", [{ key: "shop", value: "hairdresser" }], 1, true, true),
  cat("beauty", "Kosmetikstudio", "Beauty", [{ key: "shop", value: "beauty" }], 2),
  cat("nails", "Nagelstudio", "Beauty", [{ key: "beauty", value: "nails" }, { key: "shop", value: "beauty" }], 3),
  cat("barber", "Barbershop", "Beauty", [{ key: "shop", value: "hairdresser" }, { key: "male", value: "yes" }], 3),
  cat("massage", "Massage", "Beauty", [{ key: "shop", value: "massage" }, { key: "healthcare", value: "massage" }], 4),
  cat("tanning", "Sonnenstudio", "Beauty", [{ key: "shop", value: "tanning" }], 5),
  cat("car_repair", "Werkstatt", "Auto & Mobilität", [{ key: "shop", value: "car_repair" }], 1, true, true),
  cat("car_wash", "Autowäsche", "Auto & Mobilität", [{ key: "amenity", value: "car_wash" }], 2, true, true),
  cat("bicycle", "Fahrradladen", "Auto & Mobilität", [{ key: "shop", value: "bicycle" }], 3),
  cat("car_dealer", "Autohandel", "Auto & Mobilität", [{ key: "shop", value: "car" }], 4),
  cat("tyres", "Reifenservice", "Auto & Mobilität", [{ key: "shop", value: "tyres" }], 3),
  cat("driving_school", "Fahrschule", "Auto & Mobilität", [{ key: "amenity", value: "driving_school" }], 4),
  cat("cinema", "Kino", "Freizeit", [{ key: "amenity", value: "cinema" }], 6, false),
  cat("bowling", "Bowling", "Freizeit", [{ key: "sport", value: "bowling" }], 5),
  cat("dance", "Tanzschule", "Freizeit", [{ key: "amenity", value: "dancing_school" }], 4),
  cat("sports_club", "Sportverein", "Freizeit", [{ key: "leisure", value: "sports_centre" }], 6, false),
  cat("climbing", "Kletterhalle", "Freizeit", [{ key: "sport", value: "climbing" }], 5),
  cat("casino", "Spielhalle", "Freizeit", [{ key: "amenity", value: "casino" }], 7, false),
  cat("theme_park", "Freizeitpark", "Freizeit", [{ key: "tourism", value: "theme_park" }], 7, false),
  cat("florist", "Blumenladen", "Einzelhandel", [{ key: "shop", value: "florist" }], 2),
  cat("optician", "Optiker", "Einzelhandel", [{ key: "shop", value: "optician" }], 3),
  cat("books", "Buchhandlung", "Einzelhandel", [{ key: "shop", value: "books" }], 4),
  cat("clothes", "Modegeschäft", "Einzelhandel", [{ key: "shop", value: "clothes" }], 4),
  cat("shoes", "Schuhgeschäft", "Einzelhandel", [{ key: "shop", value: "shoes" }], 4),
  cat("jewelry", "Juwelier", "Einzelhandel", [{ key: "shop", value: "jewelry" }], 5),
  cat("furniture", "Möbelhaus", "Einzelhandel", [{ key: "shop", value: "furniture" }], 6),
  cat("electronics", "Elektrofachhandel", "Einzelhandel", [{ key: "shop", value: "electronics" }], 4),
  cat("pet", "Tierbedarf", "Einzelhandel", [{ key: "shop", value: "pet" }], 4),
  cat("hardware", "Baumarkt", "Einzelhandel", [{ key: "shop", value: "doityourself" }], 6, false),
  cat("stationery", "Schreibwaren", "Einzelhandel", [{ key: "shop", value: "stationery" }], 3),
  cat("cleaning", "Reinigung", "Dienstleistung", [{ key: "shop", value: "laundry" }, { key: "craft", value: "cleaning" }], 3),
  cat("building_cleaning", "Gebäudereinigung", "Dienstleistung", [{ key: "craft", value: "cleaning" }], 3),
  cat("real_estate", "Immobilienmakler", "Dienstleistung", [{ key: "office", value: "estate_agent" }], 4),
  cat("insurance", "Versicherungsmakler", "Dienstleistung", [{ key: "office", value: "insurance" }], 4),
  cat("tax", "Steuerberater", "Dienstleistung", [{ key: "office", value: "tax_advisor" }, { key: "office", value: "accountant" }], 5),
  cat("lawyer", "Rechtsanwalt", "Dienstleistung", [{ key: "office", value: "lawyer" }], 5),
  cat("photographer", "Fotograf", "Dienstleistung", [{ key: "craft", value: "photographer" }, { key: "shop", value: "photo" }], 3),
  cat("printer", "Druckerei", "Dienstleistung", [{ key: "craft", value: "printer" }, { key: "shop", value: "copyshop" }], 3)
];

export const categoryPresets = [
  { id: "gastro", label: "Gastro lokal", categoryIds: ["bakery", "cafe", "restaurant", "ice_cream", "butcher", "fast_food", "pizzeria"] },
  { id: "craft_auto", label: "Handwerk & Auto", categoryIds: ["car_repair", "car_wash", "bicycle", "tyres", "printer", "cleaning"] },
  { id: "beauty_health", label: "Beauty & Gesundheit", categoryIds: ["hairdresser", "beauty", "nails", "barber", "physio", "fitness", "ergotherapy"] },
  { id: "retail", label: "Einzelhandel", categoryIds: ["florist", "optician", "books", "clothes", "shoes", "electronics", "pet", "stationery"] },
  {
    id: "cold_top",
    label: "Top Kaltakquise",
    categoryIds: categoryRegistry.filter((item) => item.idealForColdAcquisition && item.priority <= 3).map((item) => item.id)
  }
];
