import { categoryRegistry } from "@/lib/crm/categories";

export const leadSearchRegions = [
  "Saarbrücken",
  "Saarlouis",
  "Neunkirchen",
  "Homburg",
  "Merzig",
  "St. Wendel",
  "Völklingen",
  "St. Ingbert",
  "Dillingen"
];

export const leadSearchRegionGroups = [
  { id: "saarland", label: "Saarland", country: "DE", regions: leadSearchRegions },
  { id: "germany", label: "Deutschland später", country: "DE", regions: [] }
];

export const defaultLeadSearchCategoryIds = categoryRegistry
  .filter((category) => category.defaultEnabled)
  .slice(0, 3)
  .map((category) => category.id);
