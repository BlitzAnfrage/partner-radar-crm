import type { ChainHint, Lead, LeadQuality, LeadStatus } from "@/types/crm";

export type SortMode = "score" | "quality" | "newest" | "status";

export type LeadFilters = {
  search?: string;
  region?: string;
  category?: string;
  quality?: LeadQuality | "";
  status?: LeadStatus | "";
  chain?: ChainHint | "";
  sort?: SortMode;
};

const qualityRank: Record<LeadQuality, number> = { A: 4, B: 3, C: 2, D: 1 };

export function filterAndSortLeads(leads: Lead[], filters: LeadFilters) {
  const term = filters.search?.trim().toLowerCase();

  return leads
    .filter((lead) => {
      const haystack = [
        lead.companyName,
        lead.address,
        lead.phone,
        lead.emails.join(" "),
        lead.category,
        lead.regionName
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!term || haystack.includes(term)) &&
        (!filters.region || lead.regionName === filters.region) &&
        (!filters.category || lead.category === filters.category) &&
        (!filters.quality || lead.leadQuality === filters.quality) &&
        (!filters.status || lead.status === filters.status) &&
        (!filters.chain || lead.chainHint === filters.chain)
      );
    })
    .sort((a, b) => {
      switch (filters.sort ?? "score") {
        case "quality":
          return (qualityRank[b.leadQuality as LeadQuality] ?? 0) - (qualityRank[a.leadQuality as LeadQuality] ?? 0) || b.score - a.score;
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "status":
          return a.status.localeCompare(b.status);
        case "score":
        default:
          return b.score - a.score;
      }
    });
}

export function uniqueValues(leads: Lead[], key: "regionName" | "category") {
  return Array.from(new Set(leads.map((lead) => lead[key]))).sort((a, b) => a.localeCompare(b));
}
