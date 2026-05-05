import type { Lead, LeadQuality } from "@/types/crm";

const qualityRank: Record<LeadQuality, number> = { A: 4, B: 3, C: 2, D: 1 };

export function buildCallQueue(leads: Lead[]) {
  return leads
    .filter((lead) => lead.status === "NEW" && Boolean(lead.phone) && (lead.leadQuality === "A" || lead.leadQuality === "B" || lead.leadQuality === "C"))
    .sort(compareCallQueueLeads);
}

export function countCallableLeads(leads: Lead[]) {
  return buildCallQueue(leads).length;
}

function compareCallQueueLeads(a: Lead, b: Lead) {
  const qualityDelta = (qualityRank[b.leadQuality as LeadQuality] ?? 0) - (qualityRank[a.leadQuality as LeadQuality] ?? 0);
  if (qualityDelta) return qualityDelta;

  const phoneDelta = Number(Boolean(b.phone)) - Number(Boolean(a.phone));
  if (phoneDelta) return phoneDelta;

  const localDelta = Number(b.chainHint === "LOCAL") - Number(a.chainHint === "LOCAL");
  if (localDelta) return localDelta;

  const scoreDelta = b.score - a.score;
  if (scoreDelta) return scoreDelta;

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
